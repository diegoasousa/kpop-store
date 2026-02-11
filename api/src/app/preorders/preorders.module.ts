import { Module } from "@nestjs/common";
import { PreordersIngestService } from "./preorders-ingest.service";
import { AdminPreordersIngestController } from "./admin-preorders-ingest.controller";
import { PreordersController } from "./preorders.controller";
import { PreordersService } from "./preorders.service";
import { AdminPreordersController } from "./admin-preorders.controller";

@Module({
  controllers: [
    AdminPreordersIngestController,
    PreordersController,
    AdminPreordersController,
  ],
  providers: [PreordersIngestService, PreordersService],
  exports: [PreordersIngestService, PreordersService],
})
export class PreordersModule {}
