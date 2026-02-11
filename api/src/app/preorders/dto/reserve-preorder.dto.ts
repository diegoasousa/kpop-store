import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

export class ReservePreorderDto {
  @IsInt()
  @Min(1)
  qty!: number;

  @IsString()
  customerName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}
