import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../services/api.service";

type Order = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  user?: { username: string };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocument?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  items?: { productId: string; quantity: number; priceCents: number }[];
  itemsK4u?: {
    goodsNo: number;
    productName: string;
    variationId?: string | null;
    variationName?: string | null;
    quantity: number;
    currency: string;
    priceAmount: string | number;
  }[];
  payments?: { provider: string; status: string; amountCents: number }[];
};

@Component({
  selector: "app-orders-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>Pedidos</h1>
      <section class="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Comprador</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Status</th>
              <th>Itens</th>
              <th>Endereco</th>
              <th>Criado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td>{{ o.id }}</td>
              <td>
                <div>{{ o.customerName || o.user?.username || "-" }}</div>
                <div class="sub">{{ o.customerEmail || "-" }}</div>
                <div class="sub">{{ o.customerPhone || "-" }}</div>
                <div class="sub">CPF: {{ o.customerDocument || "-" }}</div>
              </td>
              <td>{{ o.totalCents }}</td>
              <td>
                <span class="pill" [class.ok]="isPaid(o)">
                  {{ isPaid(o) ? "paid" : "unpaid" }}
                </span>
              </td>
              <td>{{ o.status }}</td>
              <td>
                <div *ngIf="o.itemsK4u?.length">
                  <div *ngFor="let item of o.itemsK4u">
                    {{ item.quantity }}x {{ item.productName }} (goodsNo: {{ item.goodsNo }})
                  </div>
                </div>
                <div *ngIf="!o.itemsK4u?.length && o.items?.length">
                  <div *ngFor="let item of o.items">
                    {{ item.quantity }}x {{ item.productId }}
                  </div>
                </div>
              </td>
              <td>
                <div>{{ o.shippingAddress || "-" }}</div>
                <div class="sub">
                  {{ o.shippingCity || "-" }} / {{ o.shippingState || "-" }}
                </div>
                <div class="sub">{{ o.shippingZipCode || "-" }}</div>
              </td>
              <td>{{ o.createdAt | date: "short" }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 24px;
      }
      .card {
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #eee;
      }
      .sub {
        font-size: 12px;
        color: #666;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        background: #eee;
      }
      .pill.ok {
        background: #c8f7c5;
      }
    `,
  ],
})
export class OrdersPage {
  orders: Order[] = [];

  constructor(private readonly api: ApiService) {
    this.api.get<Order[]>("/admin/orders").subscribe((res) => (this.orders = res));
  }

  isPaid(order: Order) {
    return (order.payments ?? []).some((p) => p.status === "APPROVED");
  }
}
