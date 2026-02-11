import { IsIn, IsString } from "class-validator";

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(["created", "paid", "ktown_ordered", "ktown_confirmed", "shipped", "delivered", "cancelled"])
  status!: string;
}
