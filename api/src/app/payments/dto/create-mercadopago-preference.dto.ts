import { IsString } from "class-validator";

export class CreateMercadoPagoPreferenceDto {
  @IsString()
  orderId!: string;
}
