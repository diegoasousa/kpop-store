import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ProductDetailsService } from "./product-details.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productDetailsService: ProductDetailsService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  @Post("cache-all-details")
  async cacheAllDetails() {
    console.log('cache-all-details endpoint called!');
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
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
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
}
