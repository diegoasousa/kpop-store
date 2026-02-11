import { IsArray, IsInt, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemInputDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
