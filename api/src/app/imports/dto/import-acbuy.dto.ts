import { ProductType } from "@prisma/client";
import { IsArray, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AcbuyItemDto } from "./acbuy-item.dto";

export class ImportAcbuyDto {
  @IsEnum(ProductType)
  assignedType!: ProductType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcbuyItemDto)
  items!: AcbuyItemDto[];
}
