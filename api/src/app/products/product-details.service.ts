import { Injectable } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../prisma/prisma.service";

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
  constructor(private readonly prisma: PrismaService) {}

  private getTtlMs() {
    const hours = Number.parseFloat(process.env.PRODUCT_DETAILS_TTL_HOURS ?? "");
    if (Number.isFinite(hours) && hours > 0) return hours * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
  }

  private getUrl(goodsNo: number) {
    const template =
      process.env.K4U_ITEMINFO_URL_TEMPLATE ??
      "https://www.ktown4u.com/_next/data/GumcmMIhzgYORfcm9c7zI/en/iteminfo.json?goods_no={goodsNo}";
    return template.replace("{goodsNo}", String(goodsNo));
  }

  async getDetails(goodsNo: number) {
    const cached = await this.prisma.productDetail.findUnique({
      where: { goodsNo },
    });

    const ttlMs = this.getTtlMs();
    if (cached) {
      const age = Date.now() - cached.updatedAt.getTime();
      if (age < ttlMs) {
        return {
          goodsNo: cached.goodsNo,
          productNo: cached.productNo,
          productName: cached.productName,
          productContent: cached.productContent,
          policy: cached.policy,
          raw: cached.raw,
          updatedAt: cached.updatedAt,
        };
      }
    }

    const url = this.getUrl(goodsNo);
    const response = await axios.get<Ktown4uDetailResponse>(url, { timeout: 15000 });
    const payload = response.data ?? {};
    const details = payload.pageProps?.productDetails;
    const productContent = details?.productExtra?.productContent ?? null;
    const policy = details?.productExtra?.policy ?? null;

    const saved = await this.prisma.productDetail.upsert({
      where: { goodsNo },
      create: {
        goodsNo,
        productNo: details?.productNo ?? null,
        productName: details?.productName ?? null,
        productContent,
        policy,
        raw: JSON.parse(JSON.stringify(payload)),
      },
      update: {
        productNo: details?.productNo ?? null,
        productName: details?.productName ?? null,
        productContent,
        policy,
        raw: JSON.parse(JSON.stringify(payload)),
      },
    });

    return {
      goodsNo: saved.goodsNo,
      productNo: saved.productNo,
      productName: saved.productName,
      productContent: saved.productContent,
      policy: saved.policy,
      raw: saved.raw,
      updatedAt: saved.updatedAt,
    };
  }
}
