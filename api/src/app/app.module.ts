import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { ImportsModule } from "./imports/imports.module";
import { OrdersModule } from "./orders/orders.module";
import { UsersModule } from "./users/users.module";
import { PreordersModule } from "./preorders/preorders.module";
import { ScheduleModule } from "@nestjs/schedule";
import { PaymentsModule } from "./payments/payments.module";
import { TranslationModule } from "./translations/translation.module";

@Module({
  imports: [
    PrismaModule,
    TranslationModule,
    ScheduleModule.forRoot(),
    AuthModule,
    ProductsModule,
    ImportsModule,
    OrdersModule,
    UsersModule,
    PreordersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
