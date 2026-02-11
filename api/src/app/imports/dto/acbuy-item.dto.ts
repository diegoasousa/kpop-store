import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class AcbuyVariationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  price?: number | string | null;
}

export class AcbuyItemDto {
  @IsString()
  sourceItemId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  productUrl?: string;

  @IsOptional()
  @IsString()
  priceText?: string;

  @IsOptional()
  @IsString()
  priceUSD?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcbuyVariationDto)
  variations?: AcbuyVariationDto[];
}
