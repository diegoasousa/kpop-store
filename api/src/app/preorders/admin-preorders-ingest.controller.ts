import { BadRequestException, Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PreordersIngestService } from "./preorders-ingest.service";

@Controller("admin/ingest")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminPreordersIngestController {
  constructor(private readonly ingestService: PreordersIngestService) {}

  @Post("ktown4u")
  async ingestKtown4u() {
    return this.ingestService.ingestKtown4u();
  }

  @Post("ktown4u-json")
  async ingestKtown4uJson(@Body() body: unknown) {
    const items = Array.isArray(body)
      ? body
      : (body as { items?: unknown } | undefined)?.items;
    if (!Array.isArray(items)) {
      throw new BadRequestException("Expected body to be an array or { items: [] }");
    }
    return this.ingestService.ingestKtown4uJson(items as Record<string, unknown>[]);
  }
}
