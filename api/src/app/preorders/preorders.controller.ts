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
import { PreordersService } from "./preorders.service";
import { ReservePreorderDto } from "./dto/reserve-preorder.dto";

@Controller("preorders")
export class PreordersController {
  constructor(private readonly preordersService: PreordersService) {}

  @Get("products")
  async listProducts(
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("sort") sort?: string,
    @Query("group") group?: string,
    @Query("kind") kind?: string
  ) {
    return this.preordersService.listProducts({
      page: page ? Number.parseInt(page, 10) : undefined,
      size: size ? Number.parseInt(size, 10) : undefined,
      sort,
      group,
      kind,
    });
  }

  @Get("products/:goodsNo")
  async getProduct(
    @Param("goodsNo", ParseIntPipe) goodsNo: number,
    @Query("raw") raw?: string
  ) {
    const includeRaw = raw === "1" || raw === "true";
    return this.preordersService.getProductByGoodsNo(goodsNo, includeRaw);
  }

  @Post("products/:goodsNo/reserve")
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
