import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().optional(),
  amount: z.number().positive(),
  expenseDate: z.string(), // ISO date string
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.string().uuid().nullable().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

// ─── GET /expenses ─────────────────────────────────────────────────────────────

export async function getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { from, to, category, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(category ? { category } : {}),
      ...((from ?? to)
        ? {
            expenseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          expenseDate: true,
          paymentMethod: true,
          notes: true,
          createdAt: true,
          branch: { select: { id: true, name: true } },
        },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.expense.count({ where }),
    ]);

    const mapped = expenses.map((e) => ({ ...e, amount: Number(e.amount) }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── POST /expenses ────────────────────────────────────────────────────────────

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId, userId } = req.user!;
    const body = createExpenseSchema.parse(req.body);

    const expense = await prisma.expense.create({
      data: {
        businessId,
        createdBy: userId,
        category: body.category,
        description: body.description,
        amount: body.amount,
        expenseDate: new Date(body.expenseDate),
        paymentMethod: body.paymentMethod,
        receiptUrl: body.receiptUrl,
        notes: body.notes,
        branchId: body.branchId ?? null,
      },
      select: {
        id: true, category: true, description: true, amount: true,
        expenseDate: true, paymentMethod: true, notes: true, createdAt: true,
        branch: { select: { id: true, name: true } },
      },
    });

    sendCreated(res, { ...expense, amount: Number(expense.amount) });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /expenses/:id ─────────────────────────────────────────────────────────

export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const body = updateExpenseSchema.parse(req.body);

    const existing = await prisma.expense.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Expense not found.', 404);

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(body.category !== undefined && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.expenseDate !== undefined && { expenseDate: new Date(body.expenseDate) }),
        ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
      },
      select: {
        id: true, category: true, description: true, amount: true,
        expenseDate: true, paymentMethod: true, notes: true, createdAt: true,
      },
    });

    sendSuccess(res, { ...expense, amount: Number(expense.amount) });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /expenses/:id ──────────────────────────────────────────────────────

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.expense.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Expense not found.', 404);

    await prisma.expense.delete({ where: { id } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
