# KpopStore

Monorepo Nx com apps NestJS (api + admin) e Prisma.

## Ambiente

Crie `.env` a partir de `.env.example`.

Variáveis necessárias:

- `DATABASE_URL="postgresql://kpop:kpop@localhost:5432/kpop_store"`
- `JWT_SECRET="change-me"`
- `USD_BRL_RATE="5.50"`
- `K4U_ITEMINFO_URL_TEMPLATE="https://www.ktown4u.com/_next/data/GumcmMIhzgYORfcm9c7zI/en/iteminfo.json?goods_no={goodsNo}"`
- `PRODUCT_DETAILS_TTL_HOURS="24"`
- `MERCADOPAGO_ACCESS_TOKEN="TEST_ACCESS_TOKEN"`
- `MERCADOPAGO_CURRENCY="BRL"`
- `PUBLIC_BASE_URL="http://localhost:3000"`
- `MERCADOPAGO_SUCCESS_URL=""`
- `MERCADOPAGO_PENDING_URL=""`
- `MERCADOPAGO_FAILURE_URL=""`
- `MERCADOPAGO_WEBHOOK_SECRET=""`
- `MERCADOPAGO_WEBHOOK_STRICT="false"`
- `MERCADOPAGO_WEBHOOK_TOLERANCE_SECONDS="300"`

## Banco de Dados

Subir Postgres local:

```sh
docker-compose up -d
```

Gerar client Prisma:

```sh
npm run prisma:generate
```

Rodar migrações:

```sh
npm run db:migrate
```

Seed (opcional):

```sh
npm run db:seed
```

## Ingestão Ktown4u

Agendamento automático a cada 30 minutos via `@nestjs/schedule`.

Disparo manual (admin):

```sh
curl -X POST http://localhost:3000/admin/ingest/ktown4u \
  -H "Authorization: Bearer <JWT_ADMIN>"
```

## Endpoints de Pré-venda

Listar produtos:

```sh
curl "http://localhost:3000/preorders/products?page=1&size=24&sort=new"
```

Detalhar produto:

```sh
curl "http://localhost:3000/preorders/products/12345"
```

Detalhar produto com descricao (cache):

```sh
curl "http://localhost:3000/api/products/12345/details"
```

## Mercado Pago (Checkout)

Criar preferencia (usuario autenticado):

```sh
curl -X POST "http://localhost:3000/api/payments/mercadopago/preference" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>"}'
```

Criar pedido guest (catalogo Ktown4u):

```sh
curl -X POST "http://localhost:3000/api/orders/ktown4u" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"goodsNo":"155615","quantity":1}],"customerName":"Ana","customerEmail":"ana@email.com","customerPhone":"11999999999","shippingAddress":"Rua X, 123","shippingCity":"São Paulo","shippingState":"SP","shippingZipCode":"01000-000"}'
```

Webhook (Mercado Pago):

```
http://localhost:3000/api/webhooks/mercadopago
```

Webhook signature:
- Quando `MERCADOPAGO_WEBHOOK_SECRET` estiver definido, o backend valida `x-signature` e `x-request-id` conforme documentação do Mercado Pago.
- `MERCADOPAGO_WEBHOOK_STRICT=true` força rejeitar webhooks sem assinatura.
- `MERCADOPAGO_WEBHOOK_TOLERANCE_SECONDS` define tolerância do timestamp (anti-replay).

Detalhar produto com `raw`:

```sh
curl "http://localhost:3000/preorders/products/12345?raw=1"
```

Reservar:

```sh
curl -X POST "http://localhost:3000/preorders/products/12345/reserve" \
  -H "Content-Type: application/json" \
  -d '{"qty":1,"customerName":"Ana","email":"ana@email.com","whatsapp":"+5511999999999"}'
```

Admin listagem de reservas:

```sh
curl "http://localhost:3000/admin/preorders?status=reserved" \
  -H "Authorization: Bearer <JWT_ADMIN>"
```

Admin atualizar status:

```sh
curl -X PATCH "http://localhost:3000/admin/preorders/<ID>/status" \
  -H "Authorization: Bearer <JWT_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid"}'
```
