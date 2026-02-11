import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login">
      <div class="card">
        <h1>Admin Login</h1>
        <label>
          Usuario
          <input [(ngModel)]="username" />
        </label>
        <label>
          Senha
          <input type="password" [(ngModel)]="password" />
        </label>
        <button (click)="submit()">Entrar</button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .login {
        min-height: 100vh;
        background: linear-gradient(120deg, #f6f4ef, #fbe7d6);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        background: #fff;
        border-radius: 12px;
        padding: 32px;
        width: 320px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        display: grid;
        gap: 12px;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
      }
      input {
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 8px;
      }
      button {
        margin-top: 8px;
        background: #121212;
        color: #fff;
        border: none;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
      }
      .error {
        color: #c0392b;
      }
    `,
  ],
})
export class LoginPage {
  username = "";
  password = "";
  error = "";

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    this.error = "";
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(["/products"]),
      error: () => {
        this.error = "Login invalido";
      },
    });
  }
}
