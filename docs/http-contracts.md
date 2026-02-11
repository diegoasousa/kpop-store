# Storefront HTTP Contracts

Base URL: `http://localhost:3000/api`

## Auth

### POST /auth/login
Request:
```json
{ "username": "admin", "password": "admin" }
```
Response:
```json
{ "accessToken": "...", "user": { "id": "...", "username": "admin", "role": "ADMIN" } }
```

## Products (public)

### GET /products
Response:
```json
[
  {
    "id": "ck...",
    "title": "Item",
    "imageUrl": "https://...",
    "productUrl": "https://...",
    "priceCents": 0,
    "type": "ALBUM",
    "images": [{ "id": "ck...", "url": "https://...", "position": 0 }],
    "variations": [{ "id": "ck...", "name": "A", "imageUrl": "https://..." }]
  }
]
```

### GET /products/:id
Response: mesmo formato de item acima.

## Orders (customer)

### POST /orders
Header: `Authorization: Bearer <token>`
Request:
```json
{
  "items": [{ "productId": "ck...", "quantity": 2 }]
}
```
Response:
```json
{
  "id": "ck...",
  "status": "PENDING",
  "totalCents": 2000,
  "items": [{ "id": "ck...", "productId": "ck...", "quantity": 2, "priceCents": 1000 }]
}
```

### GET /orders/me
Header: `Authorization: Bearer <token>`
Response: lista de pedidos do usuario autenticado.

## Admin (JWT)

### POST /admin/imports/acbuy
Header: `Authorization: Bearer <token>`
Request:
```json
{
  "assignedType": "ALBUM",
  "items": [
    {
      "sourceItemId": "123",
      "title": "Item",
      "imageUrl": "https://...",
      "productUrl": "https://...",
      "images": ["https://..."],
      "variations": [{ "name": "Ver A", "imageUrl": "https://..." }]
    }
  ]
}
```
Response:
```json
{ "batchId": "ck...", "total": 1 }
```

### GET /admin/products
Header: `Authorization: Bearer <token>`
Response: lista de produtos.

### POST /admin/products
Header: `Authorization: Bearer <token>`
Request:
```json
{ "title": "Item", "priceCents": 0, "type": "OTHER" }
```

### PATCH /admin/products/:id
Header: `Authorization: Bearer <token>`

### DELETE /admin/products/:id
Header: `Authorization: Bearer <token>`

### GET /admin/orders
Header: `Authorization: Bearer <token>`

### GET /admin/users
Header: `Authorization: Bearer <token>`

### POST /admin/users
Header: `Authorization: Bearer <token>`
Request:
```json
{ "username": "cliente1", "password": "1234", "role": "CUSTOMER" }
```
