// ─── Shared domain types used across frontend, backend, and AI service ────────

export interface Business {
  id: string;
  name: string;
  slug: string;
  email: string;
  country: string;
  currency: string;
  timezone: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  businessId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isOwner: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId?: string | null;
  supplierId?: string | null;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderPoint: number;
  reorderQuantity: number;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Pick<Category, 'id' | 'name'> | null;
  supplier?: Pick<Supplier, 'id' | 'name'> | null;
}

export type MovementType =
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'return'
  | 'transfer_in'
  | 'transfer_out'
  | 'waste'
  | 'opening_stock';

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  branchId?: string | null;
  movementType: MovementType;
  quantityDelta: number;
  unitCost?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name' | 'sku'>;
  branch?: Pick<Branch, 'id' | 'name'> | null;
}

export interface StockLevel {
  productId: string;
  branchId?: string | null;
  currentStock: number;
  belowReorderPoint: boolean;
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit' | 'reorderPoint'>;
}

export interface Customer {
  id: string;
  businessId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  tags: string[];
  totalSpent: number;
  lastPurchaseAt?: string | null;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | 'credit';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type SaleStatus = 'completed' | 'voided' | 'refunded';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  totalPrice: number;
  product?: Pick<Product, 'id' | 'name' | 'sku'>;
}

export interface Sale {
  id: string;
  businessId: string;
  branchId?: string | null;
  customerId?: string | null;
  saleDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  notes?: string | null;
  status: SaleStatus;
  createdAt: string;
  customer?: Pick<Customer, 'id' | 'fullName'> | null;
  branch?: Pick<Branch, 'id' | 'name'> | null;
  items?: SaleItem[];
}

export interface Expense {
  id: string;
  businessId: string;
  branchId?: string | null;
  category: string;
  description?: string | null;
  amount: number;
  expenseDate: string;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type EventDirection = 'inflow' | 'outflow';

export interface CashflowEvent {
  id: string;
  businessId: string;
  eventType: string;
  direction: EventDirection;
  amount: number;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  eventDate: string;
  createdAt: string;
}

export interface CashflowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  period: { from: string | null; to: string | null };
}

export interface Forecast {
  id: string;
  businessId: string;
  productId: string;
  branchId?: string | null;
  forecastPeriodStart: string;
  forecastPeriodEnd: string;
  predictedDemand: number;
  confidenceScore?: number | null;
  modelVersion?: string | null;
  forecastData?: Record<string, unknown> | null;
  generatedAt: string;
  product?: Pick<Product, 'id' | 'name' | 'sku'>;
  branch?: Pick<Branch, 'id' | 'name'> | null;
}

export type RecommendationType =
  | 'restock'
  | 'reduce_order'
  | 'promote'
  | 'discontinue'
  | 'pricing_adjustment';

export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationStatus = 'pending' | 'acknowledged' | 'acted_on' | 'dismissed';

export interface Recommendation {
  id: string;
  businessId: string;
  productId?: string | null;
  branchId?: string | null;
  forecastId?: string | null;
  recommendationType: RecommendationType;
  title: string;
  body: string;
  priority: RecommendationPriority;
  suggestedQuantity?: number | null;
  suggestedActionBy?: string | null;
  status: RecommendationStatus;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null;
}

export interface Document {
  id: string;
  businessId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storageUrl: string;
  documentType: 'invoice' | 'receipt' | 'contract' | 'report' | 'other';
  processingStatus: 'pending' | 'processing' | 'processed' | 'failed';
  notes?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  businessId: string;
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface Settings {
  id: string;
  businessId: string;
  lowStockThresholdDefault: number;
  fiscalYearStartMonth: number;
  enableDemandForecasting: boolean;
  enableCustomerAnalytics: boolean;
  forecastHorizonDays: number;
  aiModelPreference?: string | null;
  notificationPreferences: Record<string, unknown>;
  customSettings: Record<string, unknown>;
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
