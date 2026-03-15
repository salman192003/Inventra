import { PrismaClient } from '@prisma/client';

// Aggregate weekly sales for a product, then apply a simple linear trend forecast
const prisma = new PrismaClient();

interface ForecastInput {
  businessId: string;
  productId: string;
  branchId?: string;
}

/**
 * Reads the last 12 weeks of sales for a product and forecasts the next N days.
 * Stores the result in the forecasts table.
 * In production, replace the linear extrapolation below with a proper ML model call.
 */
export async function runForecast({ businessId, productId, branchId }: ForecastInput) {
  const horizonDays = 30;
  const now = new Date();
  const historyStart = new Date(now);
  historyStart.setDate(historyStart.getDate() - 84); // 12 weeks back

  // 1. Aggregate weekly demand from sale_items
  const rawSales = await prisma.saleItem.findMany({
    where: {
      businessId,
      productId,
      createdAt: { gte: historyStart },
      sale: { branchId: branchId ?? undefined, status: 'completed' },
    },
    select: { quantity: true, createdAt: true },
  });

  // Group by ISO week
  const weeklyDemand: Record<string, number> = {};
  for (const item of rawSales) {
    const week = getISOWeek(item.createdAt);
    weeklyDemand[week] = (weeklyDemand[week] ?? 0) + Number(item.quantity);
  }

  const demandValues = Object.values(weeklyDemand);
  const avgWeeklyDemand = demandValues.length > 0
    ? demandValues.reduce((a, b) => a + b, 0) / demandValues.length
    : 0;

  // 2. Simple forecast: average weekly demand extrapolated to horizon
  const predictedDemand = (avgWeeklyDemand / 7) * horizonDays;
  const confidenceScore = demandValues.length >= 4 ? 0.75 : 0.40;

  const forecastStart = new Date(now);
  forecastStart.setDate(forecastStart.getDate() + 1);
  const forecastEnd = new Date(forecastStart);
  forecastEnd.setDate(forecastEnd.getDate() + horizonDays);

  // 3. Persist forecast
  const forecast = await prisma.forecast.create({
    data: {
      businessId,
      productId,
      branchId: branchId ?? null,
      forecastPeriodStart: forecastStart,
      forecastPeriodEnd: forecastEnd,
      predictedDemand,
      confidenceScore,
      modelVersion: 'linear-avg-v1',
      forecastData: {
        weeksAnalyzed: demandValues.length,
        avgWeeklyDemand,
        demandHistory: weeklyDemand,
        horizonDays,
      },
      generatedAt: now,
    },
  });

  // 4. Check against reorder point and create recommendation if needed
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product) {
    const stockAgg = await prisma.inventoryMovement.aggregate({
      where: { businessId, productId, branchId: branchId ?? undefined },
      _sum: { quantityDelta: true },
    });
    const currentStock = Number(stockAgg._sum.quantityDelta ?? 0);

    if (currentStock - predictedDemand <= product.reorderPoint) {
      const reorderQty = Math.max(
        Number(product.reorderQuantity),
        Math.ceil(predictedDemand - currentStock + Number(product.reorderPoint)),
      );

      await prisma.recommendation.create({
        data: {
          businessId,
          productId,
          branchId: branchId ?? null,
          forecastId: forecast.id,
          recommendationType: 'restock',
          title: `Restock "${product.name}"`,
          body: `Forecasted demand for the next ${horizonDays} days is ${predictedDemand.toFixed(0)} units. Current stock is ${currentStock}. Recommend ordering ${reorderQty} units.`,
          priority: currentStock <= product.reorderPoint ? 'high' : 'medium',
          suggestedQuantity: reorderQty,
          suggestedActionBy: forecastStart,
        },
      });
    }
  }

  return forecast;
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
