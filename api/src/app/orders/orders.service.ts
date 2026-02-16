import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderSource, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreateKtown4uOrderDto } from "./dto/create-ktown4u-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }
      return {
        productId: product.id,
        quantity: item.quantity,
        priceCents: product.priceCents,
      };
    });

    const totalCents = orderItems.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );

    return this.prisma.order.create({
      data: {
        userId,
        totalCents,
        items: { create: orderItems },
      },
      include: { items: true },
    });
  }

  private usdToBrlCents(usd: number): number {
    const envRate = Number.parseFloat(process.env.USD_BRL_RATE ?? "");
    const rate = Number.isFinite(envRate) ? envRate : 5.5;
    return Math.round(usd * rate * 100);
  }

  async createKtown4uOrder(dto: CreateKtown4uOrderDto) {
    const goodsNosRaw = dto.items.map((i) => i.goodsNo);
    const numericGoodsNos = goodsNosRaw
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isFinite(id));

    const products = await this.prisma.preorderProduct.findMany({
      where: {
        goodsNo: { in: numericGoodsNos },
      },
    });
    const byGoodsNo = new Map(products.map((p) => [p.goodsNo, p]));

    const orderItems = dto.items.map((item) => {
      const maybeGoodsNo = Number.parseInt(item.goodsNo, 10);
      const product = Number.isFinite(maybeGoodsNo) ? byGoodsNo.get(maybeGoodsNo) : undefined;
      if (!product) {
        throw new NotFoundException(`Product not found: ${item.goodsNo}`);
      }
      return {
        productId: product.id,
        goodsNo: product.goodsNo,
        productName: product.name,
        variationId: item.variationId ?? null,
        variationName: null,
        quantity: item.quantity,
        currency: product.currency,
        priceAmount: product.priceAmount,
      };
    });

    const totalCents = orderItems.reduce((sum, item) => {
      const price = Number(item.priceAmount);
      return sum + this.usdToBrlCents(price) * item.quantity;
    }, 0);

    const order = await this.prisma.order.create({
      data: {
        source: OrderSource.KTOWN4U,
        totalCents,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone ?? null,
        customerDocument: dto.customerDocument ?? null,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        shippingState: dto.shippingState,
        shippingZipCode: dto.shippingZipCode,
        itemsK4u: { create: orderItems },
      },
      include: { itemsK4u: true },
    });

    return { orderId: order.id };
  }

  async listOrders() {
    return this.prisma.order.findMany({
      include: { items: true, itemsK4u: true, user: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listOrdersByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, itemsK4u: true },
      orderBy: { createdAt: "desc" },
    });
  }

  private mapOrderStatus(status: string) {
    switch (status.toLowerCase()) {
      case "paid":
        return "PAID";
      case "ktown_ordered":
        return "KTOWN_ORDERED";
      case "ktown_confirmed":
        return "KTOWN_CONFIRMED";
      case "shipped":
        return "SHIPPED";
      case "delivered":
        return "DELIVERED";
      case "cancelled":
        return "CANCELLED";
      case "created":
      default:
        return "CREATED";
    }
  }

  async updateOrderStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: this.mapOrderStatus(status) as any },
    });
  }
}
