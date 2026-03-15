import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/v1/dashboard/summary
 * Returns aggregated stats for the dashboard
 */
export async function getDashboardSummary(req: Request, res: Response) {
  const { businessId } = req.user!;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Today's revenue
  const todaySales = await prisma.sale.aggregate({
    where: {
      businessId,
      saleDate: { gte: today },
      status: 'completed',
    },
    _sum: { totalAmount: true },
  });
  const todayRevenue = Number(todaySales._sum.totalAmount ?? 0);

  // Yesterday's revenue for comparison
  const yesterdaySales = await prisma.sale.aggregate({
    where: {
      businessId,
      saleDate: { gte: yesterday, lt: today },
      status: 'completed',
    },
    _sum: { totalAmount: true },
  });
  const yesterdayRevenue = Number(yesterdaySales._sum.totalAmount ?? 0);
  const todayRevenueChange =
    yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  // Inventory value (cost price * current stock from inventory movements)
  const stockData = await prisma.$queryRaw<
    Array<{ cost_price: string; current_stock: string }>
  >`
    SELECT p.cost_price, COALESCE(SUM(im.quantity_delta), 0) as current_stock
    FROM products p
    LEFT JOIN inventory_movements im ON im.product_id = p.id
    WHERE p.business_id = ${businessId}::uuid
    GROUP BY p.id, p.cost_price
  `;
  const inventoryValue = stockData.reduce(
    (sum: number, item) => sum + Number(item.cost_price) * Number(item.current_stock),
    0,
  );

  // Low stock count - products where current stock < reorder point
  const lowStockProducts = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM products p
    WHERE p.business_id = ${businessId}::uuid
      AND (
        SELECT COALESCE(SUM(im.quantity_delta), 0)
        FROM inventory_movements im
        WHERE im.product_id = p.id
      ) < p.reorder_point
  `;
  const lowStockCount = Number(lowStockProducts[0]?.count ?? 0);

  // This month's profit (revenue - COGS - expenses)
  const thisMonthSales = await prisma.sale.findMany({
    where: {
      businessId,
      saleDate: { gte: startOfMonth },
      status: 'completed',
    },
    include: { items: true },
  });
  const thisMonthRevenue = thisMonthSales.reduce(
    (sum: number, s) => sum + Number(s.totalAmount),
    0,
  );
  const thisMonthCOGS = thisMonthSales.reduce(
    (sum: number, s) =>
      sum +
      s.items.reduce((isum: number, i) => isum + Number(i.unitCost) * Number(i.quantity), 0),
    0,
  );

  const thisMonthExpenses = await prisma.expense.aggregate({
    where: {
      businessId,
      expenseDate: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });
  const thisMonthExpenseTotal = Number(thisMonthExpenses._sum.amount ?? 0);
  const monthlyProfit = thisMonthRevenue - thisMonthCOGS - thisMonthExpenseTotal;

  // Last month's profit for comparison
  const lastMonthSales = await prisma.sale.findMany({
    where: {
      businessId,
      saleDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      status: 'completed',
    },
    include: { items: true },
  });
  const lastMonthRevenue = lastMonthSales.reduce(
    (sum: number, s) => sum + Number(s.totalAmount),
    0,
  );
  const lastMonthCOGS = lastMonthSales.reduce(
    (sum: number, s) =>
      sum +
      s.items.reduce((isum: number, i) => isum + Number(i.unitCost) * Number(i.quantity), 0),
    0,
  );
  const lastMonthExpenses = await prisma.expense.aggregate({
    where: {
      businessId,
      expenseDate: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
    _sum: { amount: true },
  });
  const lastMonthExpenseTotal = Number(lastMonthExpenses._sum.amount ?? 0);
  const lastMonthProfit = lastMonthRevenue - lastMonthCOGS - lastMonthExpenseTotal;

  const monthlyProfitChange =
    lastMonthProfit > 0 ? ((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0;

  return sendSuccess(res, {
    todayRevenue,
    todayRevenueChange,
    inventoryValue,
    lowStockCount,
    monthlyProfit,
    monthlyProfitChange,
  });
}

/**
 * GET /api/v1/dashboard/revenue-trend?days=30
 * Returns daily revenue & expenses for the specified period
 */
export async function getRevenueTrend(req: Request, res: Response) {
  const { businessId } = req.user!;
  const days = Number.parseInt(req.query.days as string, 10) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Daily sales
  const sales = await prisma.$queryRaw<
    Array<{ date: Date; revenue: number }>
  >`
    SELECT DATE(sale_date) as date, SUM(total_amount) as revenue
    FROM sales
    WHERE business_id = ${businessId}::uuid
      AND sale_date >= ${startDate}
      AND status = 'completed'
    GROUP BY DATE(sale_date)
    ORDER BY date ASC
  `;

  // Daily expenses
  const expenses = await prisma.$queryRaw<
    Array<{ date: Date; expenses: number }>
  >`
    SELECT DATE(expense_date) as date, SUM(amount) as expenses
    FROM expenses
    WHERE business_id = ${businessId}::uuid
      AND expense_date >= ${startDate}
    GROUP BY DATE(expense_date)
    ORDER BY date ASC
  `;

  // Merge into single array with all dates
  const salesMap = new Map(
    sales.map((s: { date: Date; revenue: number }) => [
      s.date.toISOString().split('T')[0],
      Number(s.revenue),
    ]),
  );
  const expensesMap = new Map(
    expenses.map((e: { date: Date; expenses: number }) => [
      e.date.toISOString().split('T')[0],
      Number(e.expenses),
    ]),
  );

  const trend = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    trend.push({
      date: dateStr,
      revenue: salesMap.get(dateStr) ?? 0,
      expenses: expensesMap.get(dateStr) ?? 0,
    });
  }

  return sendSuccess(res, trend);
}
