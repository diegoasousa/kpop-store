import { Injectable, NotFoundException } from "@nestjs/common";
import { PreorderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type SortOption = "new" | "release" | "popular";

@Injectable()
export class PreordersService {
  constructor(private readonly prisma: PrismaService) {}

  private toSort(sort?: string): SortOption {
    if (sort === "release" || sort === "popular") return sort;
    return "new";
  }

  private mapStatusToEnum(status: string): PreorderStatus {
    switch (status.toLowerCase()) {
      case "paid":
        return PreorderStatus.PAID;
      case "ordered":
        return PreorderStatus.ORDERED;
      case "shipped":
        return PreorderStatus.SHIPPED;
      case "delivered":
        return PreorderStatus.DELIVERED;
      case "canceled":
        return PreorderStatus.CANCELED;
      case "reserved":
      default:
        return PreorderStatus.RESERVED;
    }
  }

  private mapStatusToDto(status: PreorderStatus): string {
    return status.toLowerCase();
  }

  private toDto(product: {
    id: string;
    source: string;
    goodsNo: number;
    shopNo: number;
    groupName: string;
    name: string;
    kind: string | null;
    releaseDate: Date;
    isAdult: boolean;
    sale: boolean;
    currency: string;
    priceAmount: Prisma.Decimal;
    priceOriginalAmount: Prisma.Decimal | null;
    imgThumb: string;
    imgT1: string | null;
    imgT2: string | null;
    categoryPath: string | null;
    updatedAt: Date;
    raw?: Prisma.JsonValue;
  }) {
    const isPreorder = product.releaseDate.getTime() > Date.now();
    return {
      id: product.id,
      source: product.source,
      goodsNo: product.goodsNo,
      shopNo: product.shopNo,
      groupName: product.groupName,
      name: product.name,
      kind: product.kind ?? undefined,
      releaseDate: product.releaseDate,
      isAdult: product.isAdult,
      sale: product.sale,
      price: {
        currency: product.currency,
        amount: Number(product.priceAmount),
        originalAmount: product.priceOriginalAmount
          ? Number(product.priceOriginalAmount)
          : undefined,
      },
      images: {
        thumb: product.imgThumb,
        t1: product.imgT1 ?? undefined,
        t2: product.imgT2 ?? undefined,
      },
      categoryPath: product.categoryPath ?? undefined,
      updatedAt: product.updatedAt,
      isPreorder,
      raw: product.raw,
    };
  }

  async listProducts(params: {
    page?: number;
    size?: number;
    sort?: string;
    group?: string;
    kind?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const size = params.size && params.size > 0 ? params.size : 24;
    const sort = this.toSort(params.sort);

    const where: Prisma.PreorderProductWhereInput = {};
    if (params.group) {
      where.groupName = { contains: params.group, mode: "insensitive" };
    }
    if (params.kind) {
      where.kind = { contains: params.kind, mode: "insensitive" };
    }

    let orderBy: Prisma.PreorderProductOrderByWithRelationInput;
    switch (sort) {
      case "release":
        orderBy = { releaseDate: "asc" };
        break;
      case "popular":
        orderBy = { preorders: { _count: "desc" } };
        break;
      case "new":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const products = await this.prisma.preorderProduct.findMany({
      where,
      orderBy,
      skip: (page - 1) * size,
      take: size,
    });

    return products.map((product) => {
      const dto = this.toDto(product);
      delete dto.raw;
      return dto;
    });
  }

  async getProductByGoodsNo(goodsNo: number, includeRaw = false) {
    const product = await this.prisma.preorderProduct.findUnique({
      where: { goodsNo },
    });
    if (!product) throw new NotFoundException("Product not found");

    const dto = this.toDto(product);
    if (!includeRaw) {
      delete dto.raw;
    }
    return dto;
  }

  async reserveProduct(goodsNo: number, payload: {
    qty: number;
    customerName: string;
    email: string;
    whatsapp?: string;
  }) {
    const product = await this.prisma.preorderProduct.findUnique({
      where: { goodsNo },
    });
    if (!product) throw new NotFoundException("Product not found");

    const preorder = await this.prisma.preorder.create({
      data: {
        productId: product.id,
        qty: payload.qty,
        customerName: payload.customerName,
        email: payload.email,
        whatsapp: payload.whatsapp ?? null,
        status: PreorderStatus.RESERVED,
        priceLocked: product.priceAmount,
      },
    });

    return { preorderId: preorder.id, status: this.mapStatusToDto(preorder.status) };
  }

  async listPreorders(status?: string) {
    const where: Prisma.PreorderWhereInput = {};
    if (status) {
      where.status = this.mapStatusToEnum(status);
    }
    return this.prisma.preorder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
      },
    });
  }

  async updatePreorderStatus(id: string, status: string) {
    const updated = await this.prisma.preorder.update({
      where: { id },
      data: {
        status: this.mapStatusToEnum(status),
      },
    });

    return { id: updated.id, status: this.mapStatusToDto(updated.status) };
  }
}
