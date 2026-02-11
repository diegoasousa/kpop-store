import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        productUrl: dto.productUrl,
        priceCents: dto.priceCents,
        type: dto.type,
        images: dto.images
          ? { create: dto.images.map((img) => ({ url: img.url, position: img.position ?? 0 })) }
          : undefined,
        variations: dto.variations
          ? { create: dto.variations.map((v) => ({ name: v.name, imageUrl: v.imageUrl })) }
          : undefined,
      },
      include: { images: true, variations: true },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { images: true, variations: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, variations: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        productUrl: dto.productUrl,
        priceCents: dto.priceCents,
        type: dto.type,
        images: dto.images
          ? {
              deleteMany: {},
              create: dto.images.map((img) => ({ url: img.url, position: img.position ?? 0 })),
            }
          : undefined,
        variations: dto.variations
          ? {
              deleteMany: {},
              create: dto.variations.map((v) => ({ name: v.name, imageUrl: v.imageUrl })),
            }
          : undefined,
      },
      include: { images: true, variations: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
