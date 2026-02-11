import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class Ktown4uOrderItemDto {
  @IsString()
  goodsNo!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  variationId?: string;
}

export class CreateKtown4uOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Ktown4uOrderItemDto)
  items!: Ktown4uOrderItemDto[];

  @IsString()
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsString()
  customerDocument?: string;

  @IsString()
  shippingAddress!: string;

  @IsString()
  shippingCity!: string;

  @IsString()
  shippingState!: string;

  @IsString()
  shippingZipCode!: string;
}
