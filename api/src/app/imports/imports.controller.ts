import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ImportAcbuyDto } from "./dto/import-acbuy.dto";
import { ImportsService } from "./imports.service";

@Controller("admin/imports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post("acbuy")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async importAcbuy(@Body() dto: ImportAcbuyDto) {
    return this.importsService.importAcbuy(dto);
  }
}
