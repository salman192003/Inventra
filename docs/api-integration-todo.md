# API Integration TODO

Generated: 11 March 2026

---

## Legend
- ✅ Integrated & working
- ⚠️ Partially integrated (service/hook exists, but no backend route yet)
- ❌ Not integrated (frontend calls a URL the backend doesn't expose)
- 🔨 Backend route/controller missing entirely
- 💡 New API needed for a frontend feature

---

## 1. Auth — `POST/GET /api/v1/auth/*`

| Route | Status | Notes |
|---|---|---|
| `POST /auth/register` | ✅ | `authService.register` → `useRegister` hook |
| `POST /auth/login` | ✅ | `authService.login` → `useLogin` hook |
| `GET /auth/me` | ✅ | `authService.me` → `useSession` hook |

---

## 2. Dashboard — `GET /api/v1/dashboard/*`

| Route | Status | Notes |
|---|---|---|
| `GET /dashboard/summary` | ✅ | `useDashboardSummary` — fully wired |
| `GET /dashboard/revenue-trend` | ✅ | `useRevenueTrend` — used on Dashboard & Insights pages |

---

## 3. Products — `GET /api/v1/products/*`

| Route | Status | Notes |
|---|---|---|
| `GET /products` | ❌ | `productService.getAll` calls this — **no backend route/controller** |
| `GET /products/:id` | ❌ | `productService.getById` calls this — **no backend route/controller** |
| `POST /products` | ❌ | `productService.create` — **no backend route/controller** |
| `PUT /products/:id` | ❌ | `productService.update` — **no backend route/controller** |
| `DELETE /products/:id` | ❌ | `productService.delete` — **no backend route/controller** |

---

## 4. Categories — `GET /api/v1/categories/*`

| Route | Status | Notes |
|---|---|---|
| `GET /categories` | ❌ | `categoryService.getAll` — **no backend route/controller** |
| `POST /categories` | ❌ | `categoryService.create` — **no backend route/controller** |
| `PUT /categories/:id` | ❌ | `categoryService.update` — **no backend route/controller** |
| `DELETE /categories/:id` | ❌ | `categoryService.delete` — **no backend route/controller** |

---

## 5. Suppliers — `GET /api/v1/suppliers/*`

| Route | Status | Notes |
|---|---|---|
| `GET /suppliers` | ❌ | `supplierService.getAll` — **no backend route/controller** |
| `POST /suppliers` | ❌ | `supplierService.create` — **no backend route/controller** |
| `PUT /suppliers/:id` | ❌ | `supplierService.update` — **no backend route/controller** |
| `DELETE /suppliers/:id` | ❌ | `supplierService.delete` — **no backend route/controller** |

---

## 6. Inventory — `GET /api/v1/inventory/*`

| Route | Status | Notes |
|---|---|---|
| `GET /inventory/stock` | ❌ | `inventoryService.getStockLevels` — `inventory.routes.ts` is **empty** |
| `GET /inventory/movements` | ❌ | `inventoryService.getMovements` — `inventory.routes.ts` is **empty** |
| `POST /inventory/movements` | ❌ | `inventoryService.adjustStock` — `inventory.routes.ts` is **empty** |

---

## 7. Sales — `GET /api/v1/sales/*`

| Route | Status | Notes |
|---|---|---|
| `GET /sales` | ❌ | `saleService.getAll` — `sale.routes.ts` is **empty** |
| `GET /sales/:id` | ❌ | `saleService.getById` — `sale.routes.ts` is **empty** |
| `POST /sales` | ❌ | `saleService.create` — `sale.routes.ts` is **empty** |

---

## 8. Expenses — `GET /api/v1/expenses/*`

| Route | Status | Notes |
|---|---|---|
| `GET /expenses` | ❌ | `expenseService.getAll` — **no backend route/controller** |
| `POST /expenses` | ❌ | `expenseService.create` — **no backend route/controller** |
| `PUT /expenses/:id` | ❌ | `expenseService.update` — **no backend route/controller** |
| `DELETE /expenses/:id` | ❌ | `expenseService.delete` — **no backend route/controller** |

---

## 9. Cashflow — `GET /api/v1/cashflow/*`

| Route | Status | Notes |
|---|---|---|
| `GET /cashflow/summary` | ❌ | `cashflowService.getSummary` — **no backend route/controller** |
| `GET /cashflow` | ❌ | `cashflowService.getEvents` — **no backend route/controller** |

---

## 10. Customers — `GET /api/v1/customers/*`

| Route | Status | Notes |
|---|---|---|
| `GET /customers` | ❌ | `customerService.getAll` — **no backend route/controller** |
| `GET /customers/:id` | ❌ | `customerService.getById` — **no backend route/controller** |
| `POST /customers` | ❌ | `customerService.create` — **no backend route/controller** |
| `PUT /customers/:id` | ❌ | `customerService.update` — **no backend route/controller** |
| `DELETE /customers/:id` | ❌ | `customerService.delete` — **no backend route/controller** |

---

## 11. Forecasts — `GET /api/v1/forecasts/*`

| Route | Status | Notes |
|---|---|---|
| `GET /forecasts` | ❌ | `forecastService.getAll` — **no backend route/controller** |

---

## 12. Settings — `GET /api/v1/settings/*`

| Route | Status | Notes |
|---|---|---|
| `GET /settings` | ❌ | `useSettings` hook calls this — `settings.controller.ts` exists but is **not registered** in `app.ts` |
| `PUT /settings` | ❌ | `useUpdateSettings` hook calls this — controller exists but **not registered** in `app.ts` |

---

## 13. Branches — `GET /api/v1/branches/*` 🔨 Missing entirely

The Settings page uses `useBranches`, `useCreateBranch`, `useUpdateBranch`, `useDeleteBranch` hooks —
but **none of these hooks or services exist in the frontend**, and the backend has no branch routes/controller.

| Route | Status | Notes |
|---|---|---|
| `GET /branches` | 🔨 | Hook `useBranches` imported in settings page — **file doesn't exist** |
| `POST /branches` | 🔨 | Hook `useCreateBranch` imported — **file doesn't exist** |
| `PUT /branches/:id` | 🔨 | Hook `useUpdateBranch` imported — **file doesn't exist** |
| `DELETE /branches/:id` | 🔨 | Hook `useDeleteBranch` imported — **file doesn't exist** |

---

## 14. AI Service Routes (not called from frontend yet)

| Route | Status | Notes |
|---|---|---|
| `POST /forecast/run` | ❌ | AI service exists — no frontend trigger |
| `POST /rag/process` | ❌ | AI service exists — no frontend trigger |
| `POST /rag/ask` | ❌ | AI service exists — **Assistant page uses mock data only** |

---

## 15. New APIs Needed for Frontend Features

| Feature | Needed Route | Notes |
|---|---|---|
| AI Assistant page | `POST /api/v1/ai/ask` (proxies to ai-service `/rag/ask`) | Currently 100% mock responses |
| Recommendations (Insights page has a "Recommendations" concept) | `GET /api/v1/recommendations` + `PUT /api/v1/recommendations/:id` | Schema model exists, no route |
| Notifications | `GET /api/v1/notifications` + `PUT /api/v1/notifications/:id/read` | Schema model exists, no route; Navbar could show bell icon |
| Sale void/refund | `PUT /api/v1/sales/:id/void` | Frontend has no way to void a sale |
| Data Export | `GET /api/v1/export/inventory`, `/export/sales`, `/export/expenses`, `/export/customers` | Export buttons on Settings page are non-functional |
| Customer sales history | `GET /api/v1/customers/:id/sales` | CustomerDetailModal needs per-customer sales |
| Product stock history | `GET /api/v1/products/:id/movements` | Product detail would benefit from movement history |
| Dashboard top products | `GET /api/v1/dashboard/top-products` | Insights page has a placeholder for top-selling products |

---

## Summary of What Needs to Be Built

### Backend (controllers + routes to register in `app.ts`)
1. `products.controller.ts` + `products.routes.ts` (CRUD)
2. `categories.controller.ts` + `categories.routes.ts` (CRUD)
3. `suppliers.controller.ts` + `suppliers.routes.ts` (CRUD)
4. `inventory.controller.ts` — fill the empty `inventory.routes.ts` (stock levels, movements, adjust)
5. `sales.controller.ts` — fill the empty `sale.routes.ts` (list, get, create, void)
6. `expenses.controller.ts` + `expenses.routes.ts` (CRUD)
7. `cashflow.controller.ts` + `cashflow.routes.ts` (summary, events)
8. `customers.controller.ts` + `customers.routes.ts` (CRUD + sales history)
9. `forecasts.controller.ts` + `forecasts.routes.ts` (list)
10. Register the existing `settings.controller.ts` in `app.ts`
11. `branches.controller.ts` + `branches.routes.ts` (CRUD)
12. `recommendations.controller.ts` + `recommendations.routes.ts` (list, update status)
13. `notifications.controller.ts` + `notifications.routes.ts` (list, mark read)
14. `export.controller.ts` + `export.routes.ts` (CSV downloads)
15. `ai.routes.ts` — proxy to ai-service `/rag/ask` for the Assistant page

### Frontend (hooks/services missing)
1. `hooks/useSettings.ts` + `services/settingsService.ts` — imported in Settings page but **don't exist**
2. `hooks/useBranches.ts` + `services/branchService.ts` — imported in Settings page but **don't exist**
3. Connect Assistant page to real `POST /ai/ask` instead of mock responses
