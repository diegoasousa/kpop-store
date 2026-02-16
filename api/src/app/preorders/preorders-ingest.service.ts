import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import axios from "axios";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ProductDetailsService } from "../products/product-details.service";
import { TranslationService } from "../translations/translation.service";

type Ktown4uItem = Record<string, unknown>;

@Injectable()
export class PreordersIngestService {
  private readonly logger = new Logger(PreordersIngestService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly productDetailsService: ProductDetailsService,
    private readonly translationService: TranslationService
  ) {}

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^\d.]/g, "");
      if (!cleaned) return null;
      const parsed = Number.parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "y" || normalized === "yes" || normalized === "true";
    }
    return false;
  }

  private parseDate(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  private toDecimal(value: number | null, fallback = 0): Prisma.Decimal {
    const normalized = Number.isFinite(value ?? NaN) ? (value as number) : fallback;
    return new Prisma.Decimal(normalized);
  }

  private getString(value: unknown): string | null {
    if (typeof value === "string") return value;
    if (typeof value === "number") return `${value}`;
    return null;
  }

  private extractItems(payload: unknown): Ktown4uItem[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as Ktown4uItem[];
    if (typeof payload === "object" && payload !== null) {
      const asRecord = payload as Record<string, unknown>;
      const data = asRecord.data;
      if (Array.isArray(data)) return data as Ktown4uItem[];
      const items = asRecord.items;
      if (Array.isArray(items)) return items as Ktown4uItem[];
      const list = asRecord.list;
      if (Array.isArray(list)) return list as Ktown4uItem[];
    }
    return [];
  }

  private mapItem(item: Ktown4uItem, releaseType?: string, sortOrder?: number) {
    const goodsNo = this.parseNumber(item.goodsNo);
    const shopNo = this.parseNumber(item.shopNo);
    if (goodsNo === null || shopNo === null) {
      return null;
    }

    const priceAmount =
      this.parseNumber(item.dispDcPrice) ??
      this.parseNumber(item.dispPrice) ??
      this.parseNumber(item.dcPrice) ??
      this.parseNumber(item.price);
    const priceOriginalAmount = this.parseNumber(item.dispPrice);

    return {
      goodsNo: Math.trunc(goodsNo),
      shopNo: Math.trunc(shopNo),
      grpNo: this.parseNumber(item.grpNo) ?? undefined,
      groupName:
        this.getString(item.groupName) ??
        this.getString(item.grpNm) ??
        this.getString(item.artistName) ??
        "Unknown",
      name:
        this.getString(item.goodsName) ??
        this.getString(item.goodsNm) ??
        this.getString(item.name) ??
        "Untitled",
      kind:
        this.getString(item.kind) ??
        this.getString(item.goodsKind) ??
        this.getString(item.kindNm) ??
        undefined,
      releaseType: releaseType ?? undefined,
      releaseDate: this.parseDate(
        item.releaseDate ?? item.releaseDateTime ?? item.releaseDt ?? item.relDt
      ),
      sale: this.parseBoolean(item.sale) || this.parseBoolean(item.saleYn),
      isAdult: this.parseBoolean(item.isAdult) || this.parseBoolean(item.adultYn),
      currency: this.getString(item.currency) ?? this.getString(item.currFCd) ?? "USD",
      priceAmount: this.toDecimal(priceAmount, 0),
      priceOriginalAmount:
        priceOriginalAmount !== null ? this.toDecimal(priceOriginalAmount) : undefined,
      imgThumb:
        this.getString(item.imgThumb) ??
        this.getString(item.imgPath) ??
        this.getString(item.imgList) ??
        this.getString(item.imageUrl) ??
        "",
      imgT1:
        this.getString(item.imgT1) ??
        this.getString(item.mainImgPath1) ??
        undefined,
      imgT2:
        this.getString(item.imgT2) ??
        this.getString(item.mainImgPath2) ??
        undefined,
      categoryPath:
        this.getString(item.categoryPath) ??
        this.getString(item.categoryPathName) ??
        undefined,
      sortOrder: sortOrder ?? undefined,
      raw: JSON.parse(JSON.stringify(item)),
    };
  }

  private async upsertMapped(mapped: ReturnType<PreordersIngestService["mapItem"]>) {
    if (!mapped) return;

    // Translate product name to Portuguese
    const namePt = await this.translationService.translateToPortuguese(mapped.name);

    await this.prisma.$transaction(async (tx) => {
      const product = await tx.preorderProduct.upsert({
        where: { goodsNo: mapped.goodsNo },
        create: {
          source: "ktown4u",
          goodsNo: mapped.goodsNo,
          shopNo: mapped.shopNo,
          grpNo: mapped.grpNo ?? null,
          groupName: mapped.groupName,
          name: mapped.name,
          namePt: namePt,
          kind: mapped.kind ?? null,
          releaseType: mapped.releaseType ?? null,
          releaseDate: mapped.releaseDate,
          sale: mapped.sale,
          isAdult: mapped.isAdult,
          currency: mapped.currency,
          priceAmount: mapped.priceAmount,
          priceOriginalAmount: mapped.priceOriginalAmount ?? null,
          imgThumb: mapped.imgThumb,
          imgT1: mapped.imgT1 ?? null,
          imgT2: mapped.imgT2 ?? null,
          categoryPath: mapped.categoryPath ?? null,
          sortOrder: mapped.sortOrder ?? null,
          raw: mapped.raw,
        },
        update: {
          shopNo: mapped.shopNo,
          grpNo: mapped.grpNo ?? null,
          groupName: mapped.groupName,
          name: mapped.name,
          namePt: namePt,
          kind: mapped.kind ?? null,
          releaseType: mapped.releaseType ?? null,
          releaseDate: mapped.releaseDate,
          sale: mapped.sale,
          isAdult: mapped.isAdult,
          currency: mapped.currency,
          priceAmount: mapped.priceAmount,
          priceOriginalAmount: mapped.priceOriginalAmount ?? null,
          imgThumb: mapped.imgThumb,
          imgT1: mapped.imgT1 ?? null,
          imgT2: mapped.imgT2 ?? null,
          categoryPath: mapped.categoryPath ?? null,
          sortOrder: mapped.sortOrder ?? null,
          raw: mapped.raw,
        },
      });

      await tx.productSnapshot.create({
        data: {
          productId: product.id,
          priceAmount: mapped.priceAmount,
          sale: mapped.sale,
          raw: mapped.raw,
        },
      });
    });
  }

  async ingestKtown4u(maxPages = 10, size = 50) {
    return this.ingestKtown4uByType("preOrder", maxPages, size);
  }

  async ingestKtown4uByType(
    releaseType: "preOrder" | "newRelease",
    maxPages = 10,
    size = 50
  ) {
    if (this.isRunning) {
      return { status: "running", total: 0, pages: 0 };
    }

    this.isRunning = true;
    const baseUrl = `https://apis.ktown4u.com/vador/v1/products?categoryNo=1723449&currency=USD&filters=&locale=en&mainReleaseType=${releaseType}&shopNo=164&sortingType=newgoods`;

    let total = 0;
    let pages = 0;

    try {
      for (let page = 1; page <= maxPages; page += 1) {
        const url = `${baseUrl}&page=${page}&size=${size}`;
        try {
          const response = await axios.get(url, { timeout: 15000 });
          const items = this.extractItems(response.data);
          if (!items.length) break;

          pages += 1;

          for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            // Calculate global sort order: (page - 1) * size + index
            const sortOrder = (page - 1) * size + index;
            const mapped = this.mapItem(item, releaseType, sortOrder);
            if (!mapped) continue;
            await this.upsertMapped(mapped);
            total += 1;

            // Fetch and cache product details
            try {
              await this.productDetailsService.getDetails(mapped.goodsNo);
              this.logger.debug(`Cached details for product ${mapped.goodsNo}`);
            } catch (error) {
              this.logger.warn(
                `Failed to fetch details for product ${mapped.goodsNo}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              // Continue even if details fetch fails
            }

            // Delay between products to avoid rate limiting (2-5 seconds)
            const delay = 2000 + Math.floor(Math.random() * 3001);
            await this.sleep(delay);
          }

          const pageDelay = 200 + Math.floor(Math.random() * 301);
          await this.sleep(pageDelay);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 403 || status === 429) {
              this.logger.warn(
                `Ktown4u blocked with status ${status} for ${releaseType}. Stopping ingest.`
              );
              break;
            }
            this.logger.error(`Ktown4u ${releaseType} ingest failed on page ${page}`, error);
            break;
          }
          this.logger.error(`Ktown4u ${releaseType} ingest failed on page ${page}`, error as Error);
          break;
        }
      }
    } finally {
      this.isRunning = false;
    }

    return { status: "ok", total, pages };
  }

  async ingestKtown4uJson(items: Ktown4uItem[]) {
    if (this.isRunning) {
      return { status: "running", total: 0 };
    }

    this.isRunning = true;
    let total = 0;

    try {
      for (const item of items) {
        const mapped = this.mapItem(item);
        if (!mapped) continue;
        await this.upsertMapped(mapped);
        total += 1;
      }
    } finally {
      this.isRunning = false;
    }

    return { status: "ok", total };
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledIngest() {
    if (this.isRunning) return;
    this.logger.log("Starting scheduled Ktown4u ingest");
    await this.ingestBothReleaseTypes();
  }

  async ingestBothReleaseTypes() {
    if (this.isRunning) {
      return { status: "running", total: 0 };
    }

    this.logger.log("Ingesting preOrder products");
    const preOrderResult = await this.ingestKtown4uByType("preOrder");

    this.logger.log("Ingesting newRelease products");
    const newReleaseResult = await this.ingestKtown4uByType("newRelease");

    return {
      status: "ok",
      preOrder: preOrderResult,
      newRelease: newReleaseResult,
      total: preOrderResult.total + newReleaseResult.total,
    };
  }
}
