import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';

// ─── GET /forecasts ────────────────────────────────────────────────────────────

export async function getForecasts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { productId, branchId, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(productId ? { productId } : {}),
      ...(branchId ? { branchId } : {}),
    };

    const [forecasts, total] = await Promise.all([
      prisma.forecast.findMany({
        where,
        select: {
          id: true,
          productId: true,
          branchId: true,
          forecastPeriodStart: true,
          forecastPeriodEnd: true,
          predictedDemand: true,
          confidenceScore: true,
          modelVersion: true,
          generatedAt: true,
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.forecast.count({ where }),
    ]);

    const mapped = forecasts.map((f) => ({
      ...f,
      predictedDemand: Number(f.predictedDemand),
      confidenceScore: f.confidenceScore ? Number(f.confidenceScore) : null,
    }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}
