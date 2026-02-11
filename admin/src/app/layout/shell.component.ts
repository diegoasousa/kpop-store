import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">Kpop Admin</div>
        <nav>
          <a routerLink="/products" routerLinkActive="active">Produtos</a>
          <a routerLink="/imports" routerLinkActive="active">Importacao</a>
          <a routerLink="/orders" routerLinkActive="active">Pedidos</a>
          <a routerLink="/users" routerLinkActive="active">Usuarios</a>
        </nav>
        <button class="logout" (click)="logout()">Sair</button>
      </aside>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        display: grid;
        grid-template-columns: 220px 1fr;
        min-height: 100vh;
        background: #f6f4ef;
        color: #1f1f1f;
      }
      .sidebar {
        background: #121212;
        color: #fafafa;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .brand {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      nav a {
        color: #c7c7c7;
        text-decoration: none;
        font-weight: 600;
      }
      nav a.active {
        color: #ffffff;
      }
      .logout {
        margin-top: auto;
        background: #f04e3e;
        color: #fff;
        border: none;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
      }
      .content {
        padding: 32px;
      }
      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
        }
        .sidebar {
          flex-direction: row;
          align-items: center;
          overflow-x: auto;
        }
        nav {
          flex-direction: row;
        }
        .logout {
          margin-top: 0;
        }
      }
    `,
  ],
})
export class ShellComponent {
  constructor(private readonly auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
