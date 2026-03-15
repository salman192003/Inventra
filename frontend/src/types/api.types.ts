// ─── Shared API Types ─────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  isOwner: boolean;
  businessId: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  country: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  business: Business;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderPoint: number;
  reorderQuantity: number;
  isActive: boolean;
  category?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  categoryId?: string | null;
  supplierId?: string | null;
  imageUrl?: string | null;
  barcode?: string | null;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  categoryId?: string | null;
  supplierId?: string | null;
  barcode?: string | null;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface StockLevel {
  productId: string;
  branchId: string | null;
  currentStock: number;
  belowReorderPoint: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    reorderPoint: number;
  };
}

export interface InventoryMovement {
  id: string;
  productId: string;
  movementType: string;
  quantityDelta: number;
  unitCost?: number | null;
  notes?: string | null;
  createdAt: string;
  product?: { id: string; name: string; sku: string };
}

export interface AdjustStockInput {
  productId: string;
  movementType: 'adjustment' | 'purchase' | 'return' | 'waste' | 'opening_stock';
  quantityDelta: number;
  unitCost?: number;
  notes?: string;
  branchId?: string | null;
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface CreateSupplierInput {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  children?: { id: string; name: string }[];
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  totalPrice: number;
  product?: { id: string; name: string; sku: string };
}

export interface Sale {
  id: string;
  saleDate: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  status: string;
  paymentMethod: string;
  customer?: { id: string; fullName: string } | null;
  branch?: { id: string; name: string } | null;
  items: SaleItem[];
  notes?: string | null;
}

export interface CreateSaleInput {
  customerId?: string | null;
  branchId?: string | null;
  paymentMethod: string;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    discountAmount?: number;
  }[];
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  category: string;
  description?: string | null;
  amount: number;
  expenseDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
  branch?: { id: string; name: string } | null;
}

export interface CreateExpenseInput {
  category: string;
  description?: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  notes?: string;
  branchId?: string | null;
}

// ─── Cashflow ─────────────────────────────────────────────────────────────────

export interface CashflowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  period: { from: string | null; to: string | null };
}

export interface CashflowEvent {
  id: string;
  eventType: string;
  direction: 'inflow' | 'outflow';
  amount: number;
  description?: string | null;
  eventDate: string;
  branch?: { id: string; name: string } | null;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string | null;
  tags: string[];
}

export interface CreateCustomerInput {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

// ─── Forecasts ────────────────────────────────────────────────────────────────

export interface Forecast {
  id: string;
  productId: string;
  branchId?: string | null;
  forecastPeriodStart: string;
  forecastPeriodEnd: string;
  predictedDemand: number;
  confidenceScore?: number | null;
  modelVersion?: string | null;
  generatedAt: string;
  product?: { id: string; name: string; sku: string };
}

export interface Recommendation {
  id: string;
  title: string;
  body: string;
  recommendationType: 'restock' | 'reduce_order' | 'promote' | 'discontinue' | 'pricing_adjustment';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'acknowledged' | 'acted_on' | 'dismissed';
  suggestedQuantity?: number | null;
  createdAt: string;
  product?: { id: string; name: string; sku: string };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  todayRevenue: number;
  todayRevenueChange: number;
  inventoryValue: number;
  lowStockCount: number;
  monthlyProfit: number;
  monthlyProfitChange: number;
}
