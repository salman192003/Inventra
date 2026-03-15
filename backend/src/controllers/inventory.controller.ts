import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  movementType: z.enum(['purchase', 'sale', 'adjustment', 'return', 'transfer_in', 'transfer_out', 'waste', 'opening_stock']),
  quantityDelta: z.number(),
  unitCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  branchId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
});

// ─── GET /inventory/stock ──────────────────────────────────────────────────────

export async function getStockLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { branchId, lowStock } = req.query as Record<string, string>;

    // Aggregate stock per product (+ optional branch)
    type StockRow = { product_id: string; branch_id: string | null; current_stock: string };

    let stockRows: StockRow[];

    if (branchId) {
      stockRows = await prisma.$queryRaw<StockRow[]>`
        SELECT product_id, branch_id, COALESCE(SUM(quantity_delta), 0)::text as current_stock
        FROM inventory_movements
        WHERE business_id = ${businessId}::uuid
          AND branch_id = ${branchId}::uuid
        GROUP BY product_id, branch_id
      `;
    } else {
      stockRows = await prisma.$queryRaw<StockRow[]>`
        SELECT product_id, NULL::uuid as branch_id, COALESCE(SUM(quantity_delta), 0)::text as current_stock
        FROM inventory_movements
        WHERE business_id = ${businessId}::uuid
        GROUP BY product_id
      `;
    }

    // Fetch all products for this business
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, sku: true, unit: true, reorderPoint: true },
    });

    const stockMap = new Map<string, number>();
    for (const row of stockRows) {
      stockMap.set(row.product_id, Number(row.current_stock));
    }

    let result = products.map((p) => {
      const currentStock = stockMap.get(p.id) ?? 0;
      return {
        productId: p.id,
        branchId: branchId ?? null,
        currentStock,
        belowReorderPoint: currentStock < p.reorderPoint,
        product: { id: p.id, name: p.name, sku: p.sku, unit: p.unit, reorderPoint: p.reorderPoint },
      };
    });

    if (lowStock === 'true') {
      result = result.filter((s) => s.belowReorderPoint);
    }

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// ─── GET /inventory/movements ──────────────────────────────────────────────────

export async function getInventoryMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { productId, branchId, movementType, from, to, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(productId ? { productId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(movementType ? { movementType } : {}),
      ...((from ?? to)
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        select: {
          id: true,
          productId: true,
          branchId: true,
          movementType: true,
          quantityDelta: true,
          unitCost: true,
          referenceType: true,
          notes: true,
          createdAt: true,
          product: { select: { id: true, name: true, sku: true } },
          branch: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    const mapped = movements.map((m) => ({
      ...m,
      quantityDelta: Number(m.quantityDelta),
      unitCost: m.unitCost ? Number(m.unitCost) : null,
    }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── POST /inventory/movements ─────────────────────────────────────────────────

export async function adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId, userId } = req.user!;
    const body = adjustStockSchema.parse(req.body);

    // Verify product belongs to this business
    const product = await prisma.product.findFirst({ where: { id: body.productId, businessId } });
    if (!product) throw new AppError('Product not found.', 404);

    const movement = await prisma.inventoryMovement.create({
      data: {
        businessId,
        productId: body.productId,
        branchId: body.branchId ?? null,
        supplierId: body.supplierId ?? null,
        movementType: body.movementType,
        quantityDelta: body.quantityDelta,
        unitCost: body.unitCost ?? null,
        notes: body.notes,
        referenceType: 'manual',
        createdBy: userId,
      },
      select: {
        id: true,
        productId: true,
        movementType: true,
        quantityDelta: true,
        unitCost: true,
        notes: true,
        createdAt: true,
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    sendCreated(res, {
      ...movement,
      quantityDelta: Number(movement.quantityDelta),
      unitCost: movement.unitCost ? Number(movement.unitCost) : null,
    });
  } catch (err) {
    next(err);
  }
}
