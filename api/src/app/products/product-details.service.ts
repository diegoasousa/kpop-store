import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../prisma/prisma.service";
import { TranslationService } from "../translations/translation.service";

type Ktown4uDetailResponse = {
  pageProps?: {
    productDetails?: {
      productNo?: number;
      productName?: string;
      productExtra?: {
        productContent?: string;
        policy?: string;
      };
    };
  };
};

@Injectable()
export class ProductDetailsService {
  private readonly logger = new Logger(ProductDetailsService.name);
  private buildId: string | null = null;
  private buildIdFetchedAt = 0;
  private readonly buildIdTtlMs = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService
  ) {}

  private getTtlMs() {
    const hours = Number.parseFloat(process.env.PRODUCT_DETAILS_TTL_HOURS ?? "");
    if (Number.isFinite(hours) && hours > 0) return hours * 60 * 60 * 1000;
    return 72 * 60 * 60 * 1000; // 72 hours default
  }

  private async fetchBuildId(): Promise<string> {
    const age = Date.now() - this.buildIdFetchedAt;
    if (this.buildId && age < this.buildIdTtlMs) {
      return this.buildId;
    }

    this.logger.log("Fetching ktown4u buildId...");

    const response = await axios.get<string>("https://www.ktown4u.com", {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const match = response.data.match(/"buildId"\s*:\s*"([^"]+)"/);
    if (!match || !match[1]) {
      throw new Error("Could not extract buildId from ktown4u homepage");
    }

    this.buildId = match[1];
    this.buildIdFetchedAt = Date.now();
    this.logger.log(`Got ktown4u buildId: ${this.buildId}`);
    return this.buildId;
  }

  private async fetchFromJsonApi(goodsNo: number): Promise<Ktown4uDetailResponse> {
    const buildId = await this.fetchBuildId();
    const url = `https://www.ktown4u.com/_next/data/${buildId}/en/iteminfo.json?goods_no=${goodsNo}`;

    const response = await axios.get<Ktown4uDetailResponse>(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    return response.data;
  }

  async getDetails(goodsNo: number) {
    this.logger.log(`Fetching details for product ${goodsNo}`);

    const cached = await this.prisma.productDetail.findUnique({
      where: { goodsNo },
    });

    const ttlMs = this.getTtlMs();
    if (cached) {
      const age = Date.now() - cached.updatedAt.getTime();
      if (age < ttlMs) {
        this.logger.log(`Returning cached details for product ${goodsNo}`);
        return {
          goodsNo: cached.goodsNo,
          productNo: cached.productNo,
          productName: cached.productName,
          productContent: cached.productContent,
          productContentPt: cached.productContentPt,
          policy: cached.policy,
          policyPt: cached.policyPt,
          raw: cached.raw,
          updatedAt: cached.updatedAt,
        };
      }
    }

    try {
      // Try JSON API first; if buildId is stale (404), invalidate and retry once
      let payload: Ktown4uDetailResponse;
      try {
        payload = await this.fetchFromJsonApi(goodsNo);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404 && this.buildId) {
          this.logger.warn("buildId stale, refetching...");
          this.buildId = null;
          payload = await this.fetchFromJsonApi(goodsNo);
        } else {
          throw err;
        }
      }

      const details = payload.pageProps?.productDetails;
      const productContent = details?.productExtra?.productContent ?? null;
      const policy = details?.productExtra?.policy ?? null;

      const productContentPt = productContent
        ? await this.translationService.translateToPortuguese(productContent)
        : null;
      const policyPt = policy
        ? await this.translationService.translateToPortuguese(policy)
        : null;

      const saved = await this.prisma.productDetail.upsert({
        where: { goodsNo },
        create: {
          goodsNo,
          productNo: details?.productNo ?? null,
          productName: details?.productName ?? null,
          productContent,
          productContentPt,
          policy,
          policyPt,
          raw: payload,
        },
        update: {
          productNo: details?.productNo ?? null,
          productName: details?.productName ?? null,
          productContent,
          productContentPt,
          policy,
          policyPt,
          raw: payload,
        },
      });

      return {
        goodsNo: saved.goodsNo,
        productNo: saved.productNo,
        productName: saved.productName,
        productContent: saved.productContent,
        productContentPt: saved.productContentPt,
        policy: saved.policy,
        policyPt: saved.policyPt,
        raw: saved.raw,
        updatedAt: saved.updatedAt,
      };
    } catch (error) {
      // If external API fails and we have cached data, return it even if expired
      if (cached) {
        return {
          goodsNo: cached.goodsNo,
          productNo: cached.productNo,
          productName: cached.productName,
          productContent: cached.productContent,
          productContentPt: cached.productContentPt,
          policy: cached.policy,
          policyPt: cached.policyPt,
          raw: cached.raw,
          updatedAt: cached.updatedAt,
        };
      }

      // No cached data available - return empty response instead of error
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not fetch details for product ${goodsNo}: ${errorMsg}`);

      return {
        goodsNo,
        productNo: null,
        productName: null,
        productContent: null,
        productContentPt: null,
        policy: null,
        policyPt: null,
        raw: null,
        updatedAt: null,
        unavailable: true,
      };
    }
  }
}
