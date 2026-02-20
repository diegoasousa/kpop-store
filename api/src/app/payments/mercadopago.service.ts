import { Injectable, NotFoundException } from "@nestjs/common";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import axios from "axios";
import { Prisma, PaymentProvider, PaymentStatus, OrderStatus, OrderSource } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type MercadoPagoPayment = {
  id: number;
  status: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
  preference_id?: string;
};

@Injectable()
export class MercadoPagoService {
  constructor(private readonly prisma: PrismaService) {}

  private getAccessToken() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    }
    return token;
  }

  private getCurrency() {
    return process.env.MERCADOPAGO_CURRENCY ?? "BRL";
  }

  private getUsdToBrl(): number {
    const rate = Number.parseFloat(process.env.USD_TO_BRL ?? process.env.USD_BRL_RATE ?? "");
    return Number.isFinite(rate) ? rate : 5.5;
  }

  private getEnvio(): number {
    const envio = Number.parseFloat(process.env.ENVIO ?? "");
    return Number.isFinite(envio) ? envio : 0;
  }

  private computeFinalPriceBrl(amountUsd: number): number {
    const envioUsd = this.getEnvio();
    // Convert product + shipping (both USD) to BRL
    const baseBrl = (amountUsd + envioUsd) * this.getUsdToBrl();
    // 60% import tax on BRL value
    const taxa = 0.6 * baseBrl;
    // 5% margin on (base + taxa)
    const margem = 0.05 * (baseBrl + taxa);
    const subtotal = baseBrl + taxa + margem;
    // Absorb MercadoPago installment fee (4.98% + 14.93% = 19.91%)
    const total = subtotal / (1 - 0.1991);
    const rounded = Math.ceil(total / 5) * 5 - 0.01;
    return Math.max(0, rounded);
  }

  private getTransactionAmount(
    totalCents: number,
    paymentMethodId?: string,
    installments?: number,
  ): number {
    const MP_FEE_INSTALLMENT = 0.1991;
    const MP_FEE_CREDIT_VISTA = 0.0498;
    const MP_FEE_PIX = 0.0099;

    const installmentPrice = totalCents / 100;

    // Installments (2x or more): full price, no discount
    if ((installments ?? 1) > 1) {
      return installmentPrice;
    }

    // Derive real cost (without MP fee)
    const cost = installmentPrice * (1 - MP_FEE_INSTALLMENT);

    // PIX or Boleto: absorb only 0.99%
    if (paymentMethodId === 'pix' || paymentMethodId === 'bolbradesco') {
      return Math.round(cost / (1 - MP_FEE_PIX) * 100) / 100;
    }

    // Credit card single payment (1x): absorb only 4.98%
    return Math.round(cost / (1 - MP_FEE_CREDIT_VISTA) * 100) / 100;
  }

  private getWebhookUrl() {
    const baseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
    return `${baseUrl}/api/webhooks/mercadopago`;
  }

  private getBackUrls() {
    const success = process.env.MERCADOPAGO_SUCCESS_URL?.trim();
    const pending = process.env.MERCADOPAGO_PENDING_URL?.trim();
    const failure = process.env.MERCADOPAGO_FAILURE_URL?.trim();
    const backUrls: { success?: string; pending?: string; failure?: string } = {};
    if (success) backUrls.success = success;
    if (pending) backUrls.pending = pending;
    if (failure) backUrls.failure = failure;
    return Object.keys(backUrls).length ? backUrls : undefined;
  }

  private normalizePreferenceResponse(response: unknown): Record<string, unknown> {
    if (response && typeof response === "object") {
      const asRecord = response as Record<string, unknown>;
      if (asRecord.response && typeof asRecord.response === "object") {
        return asRecord.response as Record<string, unknown>;
      }
      return asRecord;
    }
    return {};
  }

  async createPreference(orderId: string, userId: string | null) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        itemsK4u: { include: { product: true } },
      },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (userId && order.userId !== userId) {
      throw new NotFoundException("Order not found");
    }

    const currency = this.getCurrency();
    const items =
      order.source === OrderSource.KTOWN4U && order.itemsK4u.length
        ? order.itemsK4u.map((item) => {
            const priceUsd = Number(item.priceAmount);
            const unitPrice =
              currency === "BRL" ? this.computeFinalPriceBrl(priceUsd) : priceUsd;
            return {
              id: String(item.goodsNo),
              title: item.productName,
              quantity: item.quantity,
              unit_price: Number(unitPrice.toFixed(2)),
              currency_id: currency,
            };
          })
        : order.items.map((item) => ({
            id: item.productId,
            title: item.product.title,
            quantity: item.quantity,
            unit_price: Number((item.priceCents / 100).toFixed(2)),
            currency_id: currency,
          }));

    const client = new MercadoPagoConfig({
      accessToken: this.getAccessToken(),
    });
    const preference = new Preference(client);

    const backUrls = this.getBackUrls();

    const preferenceResponse = await preference.create({
      body: {
        items,
        external_reference: order.id,
        notification_url: this.getWebhookUrl(),
        back_urls: backUrls,
        auto_return: backUrls?.success ? "approved" : undefined,
      },
    });

    const normalized = this.normalizePreferenceResponse(preferenceResponse);
    const preferenceId = (normalized.id as string | undefined) ?? null;

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.MERCADOPAGO,
        status: PaymentStatus.PENDING,
        amountCents: order.totalCents,
        externalId: preferenceId,
        rawPayload: JSON.parse(JSON.stringify(normalized)),
      },
    });

    return {
      preferenceId,
      initPoint: normalized.init_point ?? null,
      sandboxInitPoint: normalized.sandbox_init_point ?? null,
    };
  }

  private mapPaymentStatus(status: string): PaymentStatus {
    const normalized = status.toLowerCase();
    if (normalized === "approved") return PaymentStatus.APPROVED;
    if (normalized === "rejected" || normalized === "cancelled" || normalized === "expired") {
      return PaymentStatus.CANCELLED;
    }
    if (normalized === "in_process" || normalized === "pending") {
      return PaymentStatus.PENDING;
    }
    return PaymentStatus.FAILED;
  }

  private mapOrderStatus(status: PaymentStatus): OrderStatus | undefined {
    if (status === PaymentStatus.APPROVED) return OrderStatus.PAID;
    if (status === PaymentStatus.CANCELLED || status === PaymentStatus.FAILED) {
      return OrderStatus.CANCELLED;
    }
    return undefined;
  }

  async handlePaymentNotification(paymentId: string) {
    const accessToken = this.getAccessToken();
    const response = await axios.get<MercadoPagoPayment>(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const payment = response.data;
    const externalReference = payment.external_reference;
    if (!externalReference) {
      return { status: "ignored" };
    }

    const status = this.mapPaymentStatus(payment.status ?? "");
    const orderStatus = this.mapOrderStatus(status);

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: externalReference },
      });
      if (!order) return;

      const existing = await tx.payment.findFirst({
        where: {
          orderId: order.id,
          provider: PaymentProvider.MERCADOPAGO,
          externalId: String(payment.id),
        },
      });

      if (existing) {
        await tx.payment.update({
          where: { id: existing.id },
          data: {
            status,
            amountCents: Math.round((payment.transaction_amount ?? 0) * 100),
            rawPayload: JSON.parse(JSON.stringify(payment)),
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: PaymentProvider.MERCADOPAGO,
            status,
            amountCents: Math.round((payment.transaction_amount ?? 0) * 100),
            externalId: String(payment.id),
            rawPayload: JSON.parse(JSON.stringify(payment)),
          },
        });
      }

      if (orderStatus) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: orderStatus },
        });
      }
    });

    return { status: "ok" };
  }

  async createPayment(body: any) {
    const orderId = body?.orderId ?? body?.external_reference;
    if (!orderId || typeof orderId !== "string") {
      throw new NotFoundException("Order not found");
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");

    const client = new MercadoPagoConfig({
      accessToken: this.getAccessToken(),
    });
    const payment = new Payment(client);

    const transactionAmount = this.getTransactionAmount(
      order.totalCents,
      body?.payment_method_id,
      body?.installments,
    );

    const payload = {
      ...body,
      transaction_amount: transactionAmount,
      external_reference: order.id,
    };
    delete payload.orderId;
    // Mercado Pago payments API doesn't accept currency_id in the request body.
    delete (payload as { currency_id?: string }).currency_id;

    const response = await payment.create({ body: payload });
    const normalized = this.normalizePreferenceResponse(response);

    const statusRaw = (normalized.status as string | undefined) ?? "pending";
    const status = this.mapPaymentStatus(statusRaw);

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.MERCADOPAGO,
        status,
        amountCents: Math.round((normalized.transaction_amount as number | undefined ?? transactionAmount) * 100),
        externalId: normalized.id ? String(normalized.id) : null,
        rawPayload: JSON.parse(JSON.stringify(normalized)),
      },
    });

    const orderStatus = this.mapOrderStatus(status);
    if (orderStatus) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      });
    }

    return normalized;
  }
}
