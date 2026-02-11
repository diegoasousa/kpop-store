import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../services/api.service";

type User = {
  id: string;
  username: string;
  role: string;
  createdAt: string;
};

@Component({
  selector: "app-users-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Usuarios</h1>
      <section class="card">
        <h2>Novo Usuario</h2>
        <div class="grid">
          <label>
            Usuario
            <input [(ngModel)]="form.username" />
          </label>
          <label>
            Senha
            <input type="password" [(ngModel)]="form.password" />
          </label>
          <label>
            Perfil
            <select [(ngModel)]="form.role">
              <option value="ADMIN">ADMIN</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
          </label>
        </div>
        <button (click)="create()">Salvar</button>
      </section>

      <section class="card">
        <h2>Lista</h2>
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Perfil</th>
              <th>Criado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>{{ u.username }}</td>
              <td>{{ u.role }}</td>
              <td>{{ u.createdAt | date: "short" }}</td>
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
      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      label {
        display: grid;
        gap: 6px;
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
      button {
        margin-top: 12px;
        background: #121212;
        color: #fff;
        border: none;
        padding: 10px 14px;
        border-radius: 6px;
        cursor: pointer;
      }
    `,
  ],
})
export class UsersPage {
  users: User[] = [];
  form = {
    username: "",
    password: "",
    role: "CUSTOMER",
  };

  constructor(private readonly api: ApiService) {
    this.load();
  }

  load() {
    this.api.get<User[]>("/admin/users").subscribe((res) => (this.users = res));
  }

  create() {
    this.api.post("/admin/users", this.form).subscribe(() => {
      this.form = { username: "", password: "", role: "CUSTOMER" };
      this.load();
    });
  }
}
