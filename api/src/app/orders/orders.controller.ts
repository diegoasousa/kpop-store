import { Body, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreateKtown4uOrderDto } from "./dto/create-ktown4u-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Post("ktown4u")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async createKtown4u(@Body() dto: CreateKtown4uOrderDto) {
    return this.ordersService.createKtown4uOrder(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@CurrentUser() user: { id: string }) {
    return this.ordersService.listOrdersByUser(user.id);
  }
}
