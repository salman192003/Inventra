import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

// ─── GET /categories ───────────────────────────────────────────────────────────

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;

    const categories = await prisma.category.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        children: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

// ─── POST /categories ──────────────────────────────────────────────────────────

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const body = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        businessId,
        name: body.name,
        description: body.description,
        parentId: body.parentId ?? null,
      },
      select: { id: true, name: true, description: true, parentId: true },
    });

    sendCreated(res, category);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /categories/:id ───────────────────────────────────────────────────────

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const body = updateCategorySchema.parse(req.body);

    const existing = await prisma.category.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Category not found.', 404);

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
      },
      select: { id: true, name: true, description: true, parentId: true },
    });

    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /categories/:id ────────────────────────────────────────────────────

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.category.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Category not found.', 404);

    await prisma.category.delete({ where: { id } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
