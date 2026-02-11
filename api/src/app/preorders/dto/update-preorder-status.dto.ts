import { IsIn, IsString } from "class-validator";

export class UpdatePreorderStatusDto {
  @IsString()
  @IsIn(["reserved", "paid", "ordered", "shipped", "delivered", "canceled"])
  status!: string;
}
