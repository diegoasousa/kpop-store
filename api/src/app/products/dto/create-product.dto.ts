import { ProductType } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ProductImageDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class ProductVariationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  productUrl?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationDto)
  variations?: ProductVariationDto[];
}
