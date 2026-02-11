import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { MercadoPagoService } from "./mercadopago.service";
import { CreateMercadoPagoPreferenceDto } from "./dto/create-mercadopago-preference.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly mercadopago: MercadoPagoService) {}

  @Post("mercadopago/preference")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async createPreference(
    @CurrentUser() user: { id: string } | null,
    @Body() dto: CreateMercadoPagoPreferenceDto
  ) {
    return this.mercadopago.createPreference(dto.orderId, user?.id ?? null);
  }

  @Post("mercadopago/payment")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async createPayment(@Body() body: any) {
    return this.mercadopago.createPayment(body);
  }
}
