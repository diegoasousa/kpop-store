import { Body, Controller, Get, Param, Patch, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { OrdersService } from "./orders.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async list() {
    return this.ordersService.listOrders();
  }

  @Patch(":id/status")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }
}
