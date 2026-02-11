import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../services/api.service";

@Component({
  selector: "app-imports-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Importacao Ktown4u (JSON)</h1>
      <section class="card">
        <label>
          Tipo
          <select [(ngModel)]="assignedType">
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
          </select>
        </label>
        <label>
          JSON
          <textarea [(ngModel)]="rawJson" rows="12"></textarea>
        </label>
        <button (click)="submit()" [disabled]="loading">
          {{ loading ? "Importando..." : "Importar" }}
        </button>
        <p *ngIf="result">{{ result }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
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
        display: grid;
        gap: 12px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
      }
      label {
        display: grid;
        gap: 6px;
      }
      textarea,
      select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
          monospace;
      }
      button {
        background: #121212;
        color: #fff;
        border: none;
        padding: 10px 14px;
        border-radius: 6px;
        cursor: pointer;
      }
      .error {
        color: #c0392b;
      }
    `,
  ],
})
export class ImportsPage {
  types = ["PHOTOCARD", "LIGHTSTICK", "ALBUM", "MERCH", "DOLL", "OTHER"];
  assignedType = "OTHER";
  rawJson = "";
  result = "";
  loading = false;
  error = "";

  constructor(private readonly api: ApiService) {}

  submit() {
    this.result = "";
    this.error = "";
    this.loading = true;
    try {
      const parsed = JSON.parse(this.rawJson);
      const items = Array.isArray(parsed) ? parsed : parsed.items ?? parsed;
      this.api
        .post<{ status: string; total: number }>("/admin/ingest/ktown4u-json", {
          items,
        })
        .subscribe({
          next: (res) => {
            this.result = `Importados: ${res.total}`;
            this.rawJson = "";
            this.loading = false;
          },
          error: () => {
            this.error = "Falha ao importar";
            this.loading = false;
          },
        });
    } catch {
      this.error = "JSON invalido";
      this.loading = false;
    }
  }
}
