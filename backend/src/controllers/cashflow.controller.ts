import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';

// ─── GET /cashflow/summary ─────────────────────────────────────────────────────

export async function getCashflowSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { from, to } = req.query as Record<string, string>;

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const [inflow, outflow] = await Promise.all([
      prisma.cashflowEvent.aggregate({
        where: { businessId, direction: 'inflow', ...(Object.keys(dateFilter).length ? { eventDate: dateFilter } : {}) },
        _sum: { amount: true },
      }),
      prisma.cashflowEvent.aggregate({
        where: { businessId, direction: 'outflow', ...(Object.keys(dateFilter).length ? { eventDate: dateFilter } : {}) },
        _sum: { amount: true },
      }),
    ]);

    const totalInflow = Number(inflow._sum.amount ?? 0);
    const totalOutflow = Number(outflow._sum.amount ?? 0);

    sendSuccess(res, {
      totalInflow,
      totalOutflow,
      netCashflow: totalInflow - totalOutflow,
      period: { from: from ?? null, to: to ?? null },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /cashflow ─────────────────────────────────────────────────────────────

export async function getCashflowEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { from, to, direction, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(direction ? { direction } : {}),
      ...((from ?? to)
        ? {
            eventDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      prisma.cashflowEvent.findMany({
        where,
        select: {
          id: true,
          eventType: true,
          direction: true,
          amount: true,
          description: true,
          eventDate: true,
          createdAt: true,
          branch: { select: { id: true, name: true } },
        },
        orderBy: { eventDate: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.cashflowEvent.count({ where }),
    ]);

    const mapped = events.map((e) => ({ ...e, amount: Number(e.amount) }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}
