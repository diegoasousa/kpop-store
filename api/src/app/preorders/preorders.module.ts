import { Module, forwardRef } from "@nestjs/common";
import { PreordersIngestService } from "./preorders-ingest.service";
import { AdminPreordersIngestController } from "./admin-preorders-ingest.controller";
import { PreordersController } from "./preorders.controller";
import { PreordersService } from "./preorders.service";
import { AdminPreordersController } from "./admin-preorders.controller";
import { ProductsModule } from "../products/products.module";

@Module({
  controllers: [
    AdminPreordersIngestController,
    PreordersController,
    AdminPreordersController,
  ],
  imports: [forwardRef(() => ProductsModule)],
  providers: [PreordersIngestService, PreordersService],
  exports: [PreordersIngestService, PreordersService],
})
export class PreordersModule {}
