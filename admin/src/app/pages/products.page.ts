import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../services/api.service";

type Product = {
  id: string;
  source: string;
  goodsNo: number;
  shopNo: number;
  groupName: string;
  name: string;
  kind?: string;
  releaseDate: string;
  isAdult: boolean;
  sale: boolean;
  isPreorder: boolean;
  price: { currency: string; amount: number; originalAmount?: number };
  images: { thumb: string; t1?: string; t2?: string };
  categoryPath?: string;
};

@Component({
  selector: "app-products-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Produtos</h1>

      <section class="card">
        <h2>Cachear Detalhes dos Produtos</h2>
        <p>Busca e cacheia os detalhes (descrição, política) de todos os produtos do Ktown4u.</p>
        <div class="actions">
          <button (click)="cacheAllDetails()" [disabled]="caching">
            {{ caching ? 'Cacheando...' : 'Cachear Todos os Detalhes' }}
          </button>
        </div>
        <p class="success" *ngIf="cacheResult">
          ✓ Cacheados: {{ cacheResult.cached }}/{{ cacheResult.total }}
          <span *ngIf="cacheResult.failed > 0" class="error">
            ({{ cacheResult.failed }} falharam)
          </span>
        </p>
        <p class="error" *ngIf="cacheError">{{ cacheError }}</p>
        <div *ngIf="cacheResult && cacheResult.errors && cacheResult.errors.length > 0" class="errors-list">
          <strong>Erros (primeiros 10):</strong>
          <ul>
            <li *ngFor="let err of cacheResult.errors">
              Produto {{ err.goodsNo }}: {{ err.error }}
            </li>
          </ul>
        </div>
      </section>

      <section class="card">
        <h2>Catalogo Ktown4u (somente leitura)</h2>
        <div class="grid">
          <label>
            Grupo
            <input [(ngModel)]="filters.group" placeholder="ATEEZ" />
          </label>
          <label>
            Kind
            <input [(ngModel)]="filters.kind" placeholder="CD/LP" />
          </label>
          <label>
            Ordenar
            <select [(ngModel)]="filters.sort">
              <option value="new">new</option>
              <option value="release">release</option>
              <option value="popular">popular</option>
            </select>
          </label>
          <label>
            Page
            <input type="number" [(ngModel)]="filters.page" />
          </label>
          <label>
            Size
            <input type="number" [(ngModel)]="filters.size" />
          </label>
        </div>
        <div class="actions">
          <button (click)="load()">Atualizar</button>
        </div>
      </section>

      <section class="card">
        <h2>Lista</h2>
        <p class="error" *ngIf="error">{{ error }}</p>
        <table>
          <thead>
            <tr>
              <th>Titulo</th>
              <th>Preco</th>
              <th>Tipo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of products">
              <td>
                {{ p.name }}
                <div class="sub">{{ p.groupName }}</div>
              </td>
              <td>
                {{ p.price.currency }} {{ p.price.amount }}
                <span *ngIf="p.price.originalAmount" class="sub">
                  ({{ p.price.originalAmount }})
                </span>
              </td>
              <td>{{ p.kind }}</td>
              <td>
                <span class="pill" [class.pre]="p.isPreorder">
                  {{ p.isPreorder ? "preorder" : "instock" }}
                </span>
              </td>
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
      .error {
        color: #c0392b;
      }
      .success {
        color: #27ae60;
        margin-top: 12px;
      }
      .errors-list {
        margin-top: 12px;
        padding: 12px;
        background: #fff5f5;
        border-radius: 6px;
        font-size: 14px;
      }
      .errors-list ul {
        margin: 8px 0 0 20px;
      }
      .errors-list li {
        margin: 4px 0;
      }
      .card {
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
      }
      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
      }
      input,
      select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
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
      .link {
        background: transparent;
        color: #121212;
        border: none;
        cursor: pointer;
      }
      .sub {
        display: block;
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
      .pill.pre {
        background: #ffeaa7;
      }
      .danger {
        color: #c0392b;
        margin-left: 8px;
      }
      .actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .ghost {
        background: transparent;
        color: #121212;
        border: 1px solid #121212;
      }
      button {
        margin-top: 12px;
        background: #121212;
        color: #fff;
        border: none;
        padding: 10px 14px;
        border-radius: 6px;
        cursor: pointer;
      }
      button:disabled {
        background: #95a5a6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ProductsPage {
  products: Product[] = [];
  error = "";
  caching = false;
  cacheError = "";
  cacheResult: {
    total: number;
    cached: number;
    failed: number;
    errors: Array<{ goodsNo: number; error: string }>;
  } | null = null;
  filters = {
    page: 1,
    size: 12,
    sort: "new",
    group: "",
    kind: "",
  };

  constructor(private readonly api: ApiService) {
    this.load();
  }

  load() {
    this.error = "";
    const params = new URLSearchParams({
      page: `${this.filters.page}`,
      size: `${this.filters.size}`,
      sort: this.filters.sort,
    });
    if (this.filters.group) params.set("group", this.filters.group);
    if (this.filters.kind) params.set("kind", this.filters.kind);
    this.api.get<Product[]>(`/products?${params.toString()}`).subscribe({
      next: (res) => (this.products = res),
      error: () => {
        this.error = "Falha ao carregar produtos (verifique login e API).";
      },
    });
  }

  cacheAllDetails() {
    this.caching = true;
    this.cacheError = "";
    this.cacheResult = null;
    this.api.post<{
      total: number;
      cached: number;
      failed: number;
      errors: Array<{ goodsNo: number; error: string }>;
    }>("/products/cache-all-details", {}).subscribe({
      next: (res) => {
        this.cacheResult = res;
        this.caching = false;
      },
      error: () => {
        this.cacheError = "Falha ao cachear detalhes dos produtos.";
        this.caching = false;
      },
    });
  }
}
