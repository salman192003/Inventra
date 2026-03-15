import prisma from '../../config/prisma';

/**
 * Aggregates inventory data by computing current stock from the
 * append-only ledger and daily sales velocities from the last 90 days.
 */
export const aggregatorService = {
  /**
   * Build the payload for the Python /analyze/inventory endpoint.
   */
  async getInventoryAnalysisPayload(businessId: string) {
    // 1. Current stock per product (summing the append-only ledger)
    const stockLevels = await prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: { businessId },
      _sum: { quantityDelta: true }
    });

    // 2. Daily sales velocity over the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const salesVelocity: any[] = await prisma.$queryRaw`
      SELECT 
        si.product_id,
        SUM(si.quantity) as total_sold,
        COUNT(DISTINCT DATE(s.sale_date)) as active_days
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE s.business_id = ${businessId}::uuid
        AND s.status = 'completed'
        AND s.sale_date >= ${ninetyDaysAgo}
      GROUP BY si.product_id
    `;

    const velocityMap = new Map<string, number>();
    for (const v of salesVelocity) {
      const dailyVelocity = Number(v.total_sold) / 90; // Average over 90 days
      velocityMap.set(v.product_id, dailyVelocity);
    }

    // 3. Full product data
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      include: {
        category: { select: { name: true } },
        productSupplierPrices: {
          where: { isPreferred: true },
          select: { leadTimeDays: true }
        }
      }
    });

    const items = products.map(p => {
      const stockEntry = stockLevels.find(s => s.productId === p.id);
      const currentStock = stockEntry?._sum.quantityDelta?.toNumber() ?? 0;
      const leadTime = p.productSupplierPrices[0]?.leadTimeDays ?? 7;

      return {
        product_id: p.id,
        product_name: p.name,
        category: p.category?.name ?? 'Uncategorized',
        current_stock: currentStock,
        cost_price: Number(p.costPrice),
        selling_price: Number(p.sellingPrice),
        reorder_point: p.reorderPoint,
        daily_sales_velocity: velocityMap.get(p.id) ?? 0,
        lead_time_days: leadTime
      };
    });

    return { business_id: businessId, items };
  },

  /**
   * Build the payload for the Python /analyze/expenses endpoint.
   */
  async getExpenseAnalysisPayload(businessId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get all expenses
    const expenses: any[] = await prisma.$queryRaw`
      SELECT
        TO_CHAR(expense_date, 'YYYY-MM-DD') as ds,
        category,
        amount
      FROM expenses
      WHERE business_id = ${businessId}::uuid
        AND expense_date >= ${sixMonthsAgo}
      ORDER BY expense_date ASC
    `;

    // Get daily revenue for margin computation
    const revenueData: any[] = await prisma.$queryRaw`
      SELECT
        TO_CHAR(sale_date, 'YYYY-MM-DD') as ds,
        SUM(total_amount) as y
      FROM sales
      WHERE business_id = ${businessId}::uuid
        AND status = 'completed'
        AND sale_date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(sale_date, 'YYYY-MM-DD')
      ORDER BY ds ASC
    `;

    return {
      business_id: businessId,
      expenses: expenses.map(e => ({
        ds: e.ds,
        category: e.category,
        amount: Number(e.amount)
      })),
      revenue_data: revenueData.map(r => ({
        ds: r.ds,
        y: Number(r.y)
      }))
    };
  },

  /**
   * Build full comprehensive analysis payload combining all data sources
   * for generating Gemini-powered PDF report insights.
   */
  async getComprehensiveAnalysisData(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, currency: true }
    });

    // Summaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Revenue this month
    const thisMonthRevenue = await prisma.sale.aggregate({
      where: { businessId, saleDate: { gte: startOfMonth }, status: 'completed' },
      _sum: { totalAmount: true },
      _count: true
    });

    // Revenue last month
    const lastMonthRevenue = await prisma.sale.aggregate({
      where: { businessId, saleDate: { gte: startOfLastMonth, lte: endOfLastMonth }, status: 'completed' },
      _sum: { totalAmount: true },
      _count: true
    });

    // Expenses this month
    const thisMonthExpenses = await prisma.expense.aggregate({
      where: { businessId, expenseDate: { gte: startOfMonth } },
      _sum: { amount: true }
    });

    // Total products and customers
    const productCount = await prisma.product.count({ where: { businessId, isActive: true } });
    const customerCount = await prisma.customer.count({ where: { businessId } });
    const totalSales6m = await prisma.sale.count({
      where: { businessId, saleDate: { gte: sixMonthsAgo }, status: 'completed' }
    });

    // Recent recommendations
    const recommendations = await prisma.recommendation.findMany({
      where: { businessId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { product: { select: { name: true } } }
    });

    // Recent forecasts
    const forecasts = await prisma.forecast.findMany({
      where: { businessId },
      orderBy: { generatedAt: 'desc' },
      take: 15,
      include: { product: { select: { name: true } } }
    });

    return {
      businessName: business?.name ?? 'Unknown',
      currency: business?.currency ?? 'USD',
      reportDate: new Date().toISOString(),
      metrics: {
        thisMonthRevenue: Number(thisMonthRevenue._sum.totalAmount ?? 0),
        thisMonthSalesCount: thisMonthRevenue._count,
        lastMonthRevenue: Number(lastMonthRevenue._sum.totalAmount ?? 0),
        lastMonthSalesCount: lastMonthRevenue._count,
        thisMonthExpenses: Number(thisMonthExpenses._sum.amount ?? 0),
        totalProducts: productCount,
        totalCustomers: customerCount,
        totalSales6Months: totalSales6m,
      },
      recommendations: recommendations.map(r => ({
        product: r.product?.name ?? 'General',
        type: r.recommendationType,
        priority: r.priority,
        title: r.title,
        body: r.body
      })),
      forecasts: forecasts.map(f => ({
        product: f.product?.name ?? 'Unknown',
        predictedDemand: Number(f.predictedDemand),
        confidence: f.confidenceScore ? Number(f.confidenceScore) : null,
        periodEnd: f.forecastPeriodEnd
      }))
    };
  }
};
