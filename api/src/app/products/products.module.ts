import { Module, forwardRef } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { AdminProductsController } from "./admin-products.controller";
import { PreordersModule } from "../preorders/preorders.module";
import { ProductsService } from "./products.service";
import { ProductDetailsService } from "./product-details.service";

@Module({
  controllers: [ProductsController, AdminProductsController],
  imports: [forwardRef(() => PreordersModule)],
  providers: [ProductsService, ProductDetailsService],
  exports: [ProductsService, ProductDetailsService],
})
export class ProductsModule {}
