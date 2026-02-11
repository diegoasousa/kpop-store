import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { MercadoPagoService } from "./mercadopago.service";
import { MercadoPagoWebhookController } from "./mercadopago-webhook.controller";

@Module({
  controllers: [PaymentsController, MercadoPagoWebhookController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class PaymentsModule {}
