import { Route } from "@angular/router";
import { AuthGuard } from "./services/auth.guard";
import { LoginPage } from "./pages/login.page";
import { ShellComponent } from "./layout/shell.component";
import { ProductsPage } from "./pages/products.page";
import { ImportsPage } from "./pages/imports.page";
import { OrdersPage } from "./pages/orders.page";
import { UsersPage } from "./pages/users.page";

export const appRoutes: Route[] = [
  { path: "login", component: LoginPage },
  {
    path: "",
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: "products", component: ProductsPage },
      { path: "imports", component: ImportsPage },
      { path: "orders", component: OrdersPage },
      { path: "users", component: UsersPage },
      { path: "", pathMatch: "full", redirectTo: "products" },
    ],
  },
  { path: "**", redirectTo: "products" },
];
