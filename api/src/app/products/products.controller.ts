import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PreordersService } from "../preorders/preorders.service";
import { ProductDetailsService } from "./product-details.service";
import { ReservePreorderDto } from "../preorders/dto/reserve-preorder.dto";
import { PrismaService } from "../prisma/prisma.service";

@Controller("products")
export class ProductsController {
  constructor(
    private readonly preordersService: PreordersService,
    private readonly productDetailsService: ProductDetailsService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async listProducts(
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("sort") sort?: string,
    @Query("group") group?: string,
    @Query("kind") kind?: string,
    @Query("releaseType") releaseType?: string
  ) {
    return this.preordersService.listProducts({
      page: page ? Number.parseInt(page, 10) : undefined,
      size: size ? Number.parseInt(size, 10) : undefined,
      sort,
      group,
      kind,
      releaseType,
    });
  }

  @Post("cache-all-details")
  async cacheAllDetails() {
    const products = await this.prisma.preorderProduct.findMany({
      select: { goodsNo: true },
      orderBy: { goodsNo: 'asc' }
    });

    let cached = 0;
    let failed = 0;
    const errors: Array<{ goodsNo: number; error: string }> = [];

    for (const product of products) {
      try {
        await this.productDetailsService.getDetails(product.goodsNo);
        cached++;
        // Delay 2-5 seconds to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      } catch (error) {
        failed++;
        errors.push({
          goodsNo: product.goodsNo,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      total: products.length,
      cached,
      failed,
      errors: failed > 0 ? errors.slice(0, 10) : []
    };
  }

  @Get(":goodsNo/details")
  async getDetails(@Param("goodsNo", ParseIntPipe) goodsNo: number) {
    return this.productDetailsService.getDetails(goodsNo);
  }

  @Get(":goodsNo")
  async getProduct(
    @Param("goodsNo", ParseIntPipe) goodsNo: number,
    @Query("raw") raw?: string
  ) {
    const includeRaw = raw === "1" || raw === "true";
    return this.preordersService.getProductByGoodsNo(goodsNo, includeRaw);
  }

  @Post(":goodsNo/reserve")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async reserve(
    @Param("goodsNo", ParseIntPipe) goodsNo: number,
    @Body() dto: ReservePreorderDto
  ) {
    return this.preordersService.reserveProduct(goodsNo, dto);
  }
}
