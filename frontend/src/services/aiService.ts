import api from '@/lib/api';
import type { Recommendation } from '@/types/api.types';

export interface InventoryAnalysisProduct {
  product_id: string;
  product_name: string;
  category: string;
  abc_class: 'A' | 'B' | 'C';
  stock_status: string;
  days_of_inventory: number | null;
  revenue_contribution_pct: number;
  current_stock: number;
  daily_velocity: number;
  recommendation: string;
}

export interface InventoryAnalysis {
  business_id: string;
  products: InventoryAnalysisProduct[];
  summary: {
    total_products: number;
    a_count: number;
    b_count: number;
    c_count: number;
    overstocked_count: number;
    optimal_count: number;
    understocked_count: number;
    critical_count: number;
    dead_stock_count: number;
    total_inventory_value: number;
    overstocked_value: number;
  };
}

export interface CategoryExpenseSummary {
  category: string;
  total_amount: number;
  avg_monthly: number;
  trend: number;
  pct_of_total: number;
}

export interface ExpenseAnomaly {
  category: string;
  date: string;
  amount: number;
  expected_amount: number;
  deviation_pct: number;
  severity: 'high' | 'medium' | 'low';
}

export interface ProfitMarginPoint {
  ds: string;
  revenue: number;
  expenses: number;
  margin: number;
  margin_pct: number;
}

export interface ExpenseAnalysis {
  business_id: string;
  anomalies: ExpenseAnomaly[];
  category_summaries: CategoryExpenseSummary[];
  profit_margins: ProfitMarginPoint[];
  total_expenses: number;
  total_revenue: number;
  overall_margin_pct: number;
}

export interface BusinessReport {
  businessName: string;
  currency: string;
  reportDate: string;
  metrics: {
    thisMonthRevenue: number;
    thisMonthSalesCount: number;
    lastMonthRevenue: number;
    lastMonthSalesCount: number;
    thisMonthExpenses: number;
    totalProducts: number;
    totalCustomers: number;
    totalSales6Months: number;
  };
  sections: {
    executiveSummary: string;
    revenueAnalysis: string;
    inventoryHealth: string;
    expenseAnalysis: string;
    recommendations: string;
    outlook: string;
  };
  inventoryAnalysis: {
    summary: InventoryAnalysis['summary'];
    criticalItems: InventoryAnalysisProduct[];
  } | null;
  expenseAnalysis: {
    categorySummaries: CategoryExpenseSummary[];
    anomalies: ExpenseAnomaly[];
    overallMarginPct: number;
  } | null;
  forecasts: {
    product: string;
    predictedDemand: number;
    confidence: number | null;
    periodEnd: string;
  }[];
}

export const aiService = {
  async getInsights(): Promise<Recommendation[]> {
    const res = await api.get('/ai/insights');
    return res.data.data;
  },

  async getInventoryAnalysis(): Promise<InventoryAnalysis> {
    const res = await api.get('/ai/inventory-analysis');
    return res.data.data;
  },

  async getExpenseAnalysis(): Promise<ExpenseAnalysis> {
    const res = await api.get('/ai/expense-analysis');
    return res.data.data;
  },

  async getBusinessAnalysis() {
    const res = await api.get('/ai/business-analysis');
    return res.data.data;
  },

  async generateReport(): Promise<BusinessReport> {
    const res = await api.get('/ai/report');
    return res.data.data;
  },

  async triggerForecasting(): Promise<void> {
    await api.post('/ai/forecast/trigger');
  },

  async triggerInsights(): Promise<void> {
    await api.post('/ai/insights/trigger');
  },

  async updateRecommendationStatus(id: string, status: 'acted_on' | 'dismissed' | 'acknowledged'): Promise<void> {
    await api.patch(`/ai/recommendations/${id}/status`, { status });
  }
};
