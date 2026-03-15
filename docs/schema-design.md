# Inventra — Schema Design Documentation

This document is the canonical reference for the Inventra database schema.

## Quick Reference

### Tables

| Table | Layer | Purpose |
|---|---|---|
| `businesses` | Platform | Root entity, one per registered company |
| `users` | Platform | Individuals who log in and manage a business |
| `settings` | Platform | Per-business config and feature flags |
| `branches` | Operations | Physical store locations / warehouses |
| `categories` | Operations | Hierarchical product categories |
| `suppliers` | Operations | Vendors / purchasing contacts |
| `products` | Operations | Product catalog (no stock qty stored here) |
| `product_supplier_prices` | Operations | Multi-supplier pricing per product |
| `inventory_movements` | Inventory | **Append-only ledger** of every stock change |
| `customers` | Sales | Optional customer profiles |
| `sales` | Sales | Sales transaction headers |
| `sale_items` | Sales | Line items within a sale |
| `expenses` | Finance | Operating expenses (rent, utilities, etc.) |
| `cashflow_events` | Finance | Unified cash inflow/outflow ledger |
| `forecasts` | AI | AI-generated demand predictions per product |
| `recommendations` | AI | Actionable AI suggestions (restock, promote, etc.) |
| `documents` | Documents | Uploaded file metadata |
| `document_chunks` | Documents | Text chunks + vector embeddings for RAG |
| `notifications` | Support | In-app notifications |

---

## Multi-Tenancy Strategy

Every table that stores business data includes a `business_id UUID` column.

All queries at the application layer **must** filter on `business_id`. This provides logical data isolation between businesses.

Row-Level Security (RLS) can be enabled in Supabase as an additional defense-in-depth layer.

---

## Event-Based Inventory

**Never UPDATE stock quantities directly.**

All stock changes are rows in `inventory_movements`.

```sql
-- Current stock level for a product at a branch:
SELECT SUM(quantity_delta)
FROM inventory_movements
WHERE product_id = $1
  AND branch_id = $2
  AND business_id = $3;
```

Movement types:
- `purchase` — stock received from supplier
- `sale` — stock removed by a customer sale
- `adjustment` — manual correction
- `return` — customer return (stock restored)
- `transfer_in` / `transfer_out` — inter-branch transfer
- `waste` — damaged/expired stock
- `opening_stock` — initial stock when onboarding

---

## Demand Forecasting Pipeline

```
sale_items (product_id, quantity, sale_date)
    ↓ aggregated weekly by AI service
forecastService.ts → forecasts table
    ↓ if predicted_demand > current_stock - reorder_point
recommendations table (type: 'restock')
```

---

## RAG Pipeline

```
Document uploaded → documents.processing_status = 'pending'
    ↓ AI service picks up via /rag/process
Text chunked → document_chunks (chunk_text + embedding vector)
    ↓ User asks a question via /rag/ask
Query embedded → similarity search (embedding <=> query_vector)
    ↓ Top-K chunks retrieved
GPT generates answer with context
```

pgvector HNSW index on `document_chunks.embedding` for fast ANN search.

---

## Key Performance Indexes

| Table | Index | Purpose |
|---|---|---|
| `inventory_movements` | `(business_id, product_id)` | Stock level calculation |
| `inventory_movements` | `(business_id, created_at)` | Time-range analytics |
| `sales` | `(business_id, sale_date)` | Revenue trends |
| `sales` | `(business_id, customer_id)` | Customer purchase history |
| `sale_items` | `(business_id, product_id)` | Best-selling products |
| `cashflow_events` | `(business_id, direction, event_date)` | Cashflow dashboard |
| `customers` | `(business_id, last_purchase_at)` | Churn detection |
| `document_chunks` | HNSW on `embedding` | Vector semantic search |
| `notifications` | `(business_id, user_id, is_read)` | Unread badge count |
