import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { tap } from "rxjs";
import { ApiService } from "./api.service";

type AuthResponse = {
  accessToken: string;
  user: { id: string; username: string; role: string };
};

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly tokenKey = "kpop_admin_token";

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  login(username: string, password: string) {
    return this.api.post<AuthResponse>("/auth/login", { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.accessToken);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(["/login"]);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}
