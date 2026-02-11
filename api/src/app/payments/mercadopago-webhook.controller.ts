import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import crypto from "crypto";
import { MercadoPagoService } from "./mercadopago.service";

@Controller("webhooks/mercadopago")
export class MercadoPagoWebhookController {
  private readonly logger = new Logger(MercadoPagoWebhookController.name);

  constructor(private readonly mercadopago: MercadoPagoService) {}

  private getSecret() {
    return process.env.MERCADOPAGO_WEBHOOK_SECRET;
  }

  private isStrictMode() {
    return (process.env.MERCADOPAGO_WEBHOOK_STRICT ?? "false").toLowerCase() === "true";
  }

  private getTimestampToleranceMs() {
    const seconds = Number.parseFloat(
      process.env.MERCADOPAGO_WEBHOOK_TOLERANCE_SECONDS ?? ""
    );
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
    return 5 * 60 * 1000;
  }

  private parseSignatureHeader(value?: string) {
    if (!value) return null;
    const parts = value.split(",").map((part) => part.trim());
    const parsed: { ts?: string; v1?: string } = {};
    for (const part of parts) {
      const [key, rawValue] = part.split("=");
      if (!key || rawValue === undefined) continue;
      const trimmedKey = key.trim();
      const trimmedValue = rawValue.trim();
      if (trimmedKey === "ts") parsed.ts = trimmedValue;
      if (trimmedKey === "v1") parsed.v1 = trimmedValue;
    }
    return parsed.ts && parsed.v1 ? parsed : null;
  }

  private normalizeDataId(value?: string | null) {
    if (!value) return null;
    return /[a-zA-Z]/.test(value) ? value.toLowerCase() : value;
  }

  private buildManifest(dataId?: string | null, requestId?: string | null, ts?: string | null) {
    const segments: string[] = [];
    if (dataId) segments.push(`id:${dataId};`);
    if (requestId) segments.push(`request-id:${requestId};`);
    if (ts) segments.push(`ts:${ts};`);
    return segments.join("");
  }

  private verifySignature(options: {
    signatureHeader?: string;
    requestIdHeader?: string;
    dataIdQuery?: string | null;
  }) {
    const secret = this.getSecret();
    if (!secret) {
      if (this.isStrictMode()) {
        this.logger.warn("Webhook signature secret missing in strict mode");
        throw new UnauthorizedException("Webhook secret not configured");
      }
      return;
    }
    const parsed = this.parseSignatureHeader(options.signatureHeader);
    if (!parsed) {
      this.logger.warn("Webhook signature header missing or invalid");
      throw new UnauthorizedException("Invalid webhook signature");
    }
    const dataId = this.normalizeDataId(options.dataIdQuery);
    const manifest = this.buildManifest(dataId, options.requestIdHeader ?? null, parsed.ts ?? null);
    if (!manifest) {
      this.logger.warn("Webhook signature manifest invalid");
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const tsNumber = Number.parseInt(parsed.ts ?? "", 10);
    if (!Number.isFinite(tsNumber)) {
      this.logger.warn("Webhook signature timestamp invalid");
      throw new UnauthorizedException("Invalid webhook signature");
    }
    const toleranceMs = this.getTimestampToleranceMs();
    if (Math.abs(Date.now() - tsNumber) > toleranceMs) {
      this.logger.warn("Webhook signature timestamp outside tolerance");
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const computed = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");
    if (computed !== parsed.v1) {
      this.logger.warn("Webhook signature mismatch");
      throw new UnauthorizedException("Invalid webhook signature");
    }
  }

  @Get()
  async handleGet(
    @Headers("x-signature") signature?: string,
    @Headers("x-request-id") requestId?: string,
    @Query("topic") topic?: string,
    @Query("id") id?: string,
    @Query("type") type?: string,
    @Query("data.id") dataId?: string
  ) {
    this.verifySignature({
      signatureHeader: signature,
      requestIdHeader: requestId,
      dataIdQuery: dataId ?? id ?? null,
    });
    const resolvedTopic = topic ?? type ?? "";
    const resolvedId = id ?? dataId;
    if (resolvedTopic === "payment" && resolvedId) {
      return this.mercadopago.handlePaymentNotification(resolvedId);
    }
    return { status: "ignored" };
  }

  @Post()
  async handlePost(
    @Body() body: any,
    @Headers("x-signature") signature?: string,
    @Headers("x-request-id") requestId?: string,
    @Query("topic") topic?: string,
    @Query("id") id?: string,
    @Query("data.id") dataId?: string
  ) {
    this.verifySignature({
      signatureHeader: signature,
      requestIdHeader: requestId,
      dataIdQuery: dataId ?? body?.data?.id ?? id ?? null,
    });
    const resolvedTopic = topic ?? body?.type ?? body?.topic ?? "";
    const resolvedId = id ?? body?.data?.id ?? body?.resource ?? body?.id;
    if (resolvedTopic === "payment" && resolvedId) {
      return this.mercadopago.handlePaymentNotification(String(resolvedId));
    }
    return { status: "ignored" };
  }
}
