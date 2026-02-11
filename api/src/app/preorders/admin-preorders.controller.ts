import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PreordersService } from "./preorders.service";
import { UpdatePreorderStatusDto } from "./dto/update-preorder-status.dto";

@Controller("admin/preorders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminPreordersController {
  constructor(private readonly preordersService: PreordersService) {}

  @Get()
  async list(@Query("status") status?: string) {
    return this.preordersService.listPreorders(status);
  }

  @Patch(":id/status")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdatePreorderStatusDto
  ) {
    return this.preordersService.updatePreorderStatus(id, dto.status);
  }
}
