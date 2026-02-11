import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ImportAcbuyDto } from "./dto/import-acbuy.dto";

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseUsd(value?: string | number | null): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const cleaned = value.replace(/[^\d.]/g, "");
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private usdToBrlCents(usd: number): number {
    const envRate = Number.parseFloat(process.env.USD_BRL_RATE ?? "");
    const rate = Number.isFinite(envRate) ? envRate : 5.5;
    const brl = usd * rate;
    const withFees = brl * 2;
    return Math.round(withFees * 100);
  }

  async importAcbuy(dto: ImportAcbuyDto) {
    const batch = await this.prisma.importBatch.create({
      data: {
        source: "acbuy",
        assignedType: dto.assignedType,
        rawJson: JSON.parse(JSON.stringify(dto)),
      },
    });

    const results = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.product.upsert({
          where: { sourceItemId: item.sourceItemId },
          create: {
            sourceItemId: item.sourceItemId,
            title: item.title,
            imageUrl: item.imageUrl,
            productUrl: item.productUrl,
            priceText: item.priceText,
            priceCents: this.usdToBrlCents(
              this.parseUsd(item.priceUSD ?? item.priceText) ?? 0
            ),
            type: dto.assignedType,
            images: item.images
              ? { create: item.images.map((url, index) => ({ url, position: index })) }
              : undefined,
            variations: item.variations
              ? {
                  create: item.variations.map((v) => ({
                    name: v.name,
                    imageUrl: v.imageUrl,
                    priceCents: this.usdToBrlCents(
                      this.parseUsd(v.price) ??
                        this.parseUsd(item.priceUSD ?? item.priceText) ??
                        0
                    ),
                  })),
                }
              : undefined,
          },
          update: {
            title: item.title,
            imageUrl: item.imageUrl,
            productUrl: item.productUrl,
            priceText: item.priceText ?? undefined,
            priceCents: this.usdToBrlCents(
              this.parseUsd(item.priceUSD ?? item.priceText) ?? 0
            ),
            type: dto.assignedType,
            images: item.images
              ? {
                  deleteMany: {},
                  create: item.images.map((url, index) => ({ url, position: index })),
                }
              : undefined,
            variations: item.variations
              ? {
                  deleteMany: {},
                  create: item.variations.map((v) => ({
                    name: v.name,
                    imageUrl: v.imageUrl,
                    priceCents: this.usdToBrlCents(
                      this.parseUsd(v.price) ??
                        this.parseUsd(item.priceUSD ?? item.priceText) ??
                        0
                    ),
                  })),
                }
              : undefined,
          },
        })
      )
    );

    return {
      batchId: batch.id,
      total: results.length,
    };
  }
}
