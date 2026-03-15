import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  description: z.string().optional(),
  unit: z.string().default('pcs'),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  reorderPoint: z.number().int().min(0).default(0),
  reorderQuantity: z.number().int().min(0).default(0),
  categoryId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  barcode: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const updateProductSchema = createProductSchema.partial();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const productSelect = {
  id: true,
  name: true,
  sku: true,
  description: true,
  unit: true,
  costPrice: true,
  sellingPrice: true,
  reorderPoint: true,
  reorderQuantity: true,
  isActive: true,
  imageUrl: true,
  barcode: true,
  categoryId: true,
  supplierId: true,
  category: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
};

// ─── GET /products ─────────────────────────────────────────────────────────────

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { search, categoryId, supplierId, isActive, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(isActive === undefined ? {} : { isActive: isActive === 'true' }),
      ...(categoryId ? { categoryId } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productSelect,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    const mapped = products.map((p) => ({
      ...p,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
    }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── GET /products/:id ─────────────────────────────────────────────────────────

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, businessId },
      select: productSelect,
    });

    if (!product) throw new AppError('Product not found.', 404);

    sendSuccess(res, { ...product, costPrice: Number(product.costPrice), sellingPrice: Number(product.sellingPrice) });
  } catch (err) {
    next(err);
  }
}

// ─── POST /products ────────────────────────────────────────────────────────────

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const body = createProductSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        businessId,
        name: body.name,
        sku: body.sku,
        description: body.description,
        unit: body.unit,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        reorderPoint: body.reorderPoint,
        reorderQuantity: body.reorderQuantity,
        categoryId: body.categoryId ?? null,
        supplierId: body.supplierId ?? null,
        barcode: body.barcode ?? null,
        imageUrl: body.imageUrl ?? null,
      },
      select: productSelect,
    });

    sendCreated(res, { ...product, costPrice: Number(product.costPrice), sellingPrice: Number(product.sellingPrice) });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /products/:id ─────────────────────────────────────────────────────────

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const body = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Product not found.', 404);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
        ...(body.sellingPrice !== undefined && { sellingPrice: body.sellingPrice }),
        ...(body.reorderPoint !== undefined && { reorderPoint: body.reorderPoint }),
        ...(body.reorderQuantity !== undefined && { reorderQuantity: body.reorderQuantity }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.supplierId !== undefined && { supplierId: body.supplierId }),
        ...(body.barcode !== undefined && { barcode: body.barcode }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      },
      select: productSelect,
    });

    sendSuccess(res, { ...product, costPrice: Number(product.costPrice), sellingPrice: Number(product.sellingPrice) });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /products/:id ──────────────────────────────────────────────────────

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Product not found.', 404);

    // Soft delete — keep history intact
    await prisma.product.update({ where: { id }, data: { isActive: false } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
