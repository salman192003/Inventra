import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
});

const createSaleSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  saleDate: z.string().optional(), // ISO date string, defaults to today
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit']),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']).default('paid'),
  amountPaid: z.number().min(0).optional(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const saleSelect = {
  id: true,
  saleDate: true,
  subtotal: true,
  discountAmount: true,
  taxAmount: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  amountPaid: true,
  status: true,
  notes: true,
  createdAt: true,
  customer: { select: { id: true, fullName: true } },
  branch: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      unitPrice: true,
      unitCost: true,
      discountAmount: true,
      totalPrice: true,
      product: { 
        select: { 
          id: true, 
          name: true, 
          sku: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        } 
      },
    },
  },
};

function formatSale(sale: Record<string, unknown>) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discountAmount: Number(sale.discountAmount),
    taxAmount: Number(sale.taxAmount),
    totalAmount: Number(sale.totalAmount),
    amountPaid: Number(sale.amountPaid),
    items: (sale.items as Record<string, unknown>[]).map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      unitCost: Number(i.unitCost),
      discountAmount: Number(i.discountAmount),
      totalPrice: Number(i.totalPrice),
    })),
  };
}

// ─── GET /sales ────────────────────────────────────────────────────────────────

export async function getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { from, to, customerId, status, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...((from ?? to)
        ? {
            saleDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: saleSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.sale.count({ where }),
    ]);

    sendSuccess(res, sales.map((s) => formatSale(s as unknown as Record<string, unknown>)), 200, {
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /sales/:id ────────────────────────────────────────────────────────────

export async function getSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const sale = await prisma.sale.findFirst({
      where: { id, businessId },
      select: saleSelect,
    });

    if (!sale) throw new AppError('Sale not found.', 404);

    sendSuccess(res, formatSale(sale as unknown as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
}

// ─── POST /sales ───────────────────────────────────────────────────────────────

export async function createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId, userId } = req.user!;
    const body = createSaleSchema.parse(req.body);

    const subtotal = body.items.reduce(
      (sum, it) => sum + it.quantity * it.unitPrice - it.discountAmount,
      0,
    );
    const totalAmount = subtotal - body.discountAmount + body.taxAmount;
    const amountPaid = body.amountPaid ?? totalAmount;

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          businessId,
          customerId: body.customerId ?? null,
          branchId: body.branchId ?? null,
          createdBy: userId,
          saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
          subtotal,
          discountAmount: body.discountAmount,
          taxAmount: body.taxAmount,
          totalAmount,
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentStatus,
          amountPaid,
          notes: body.notes,
          status: 'completed',
          items: {
            create: body.items.map((it) => ({
              businessId,
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              unitCost: it.unitCost,
              discountAmount: it.discountAmount,
              totalPrice: it.quantity * it.unitPrice - it.discountAmount,
            })),
          },
        },
        select: saleSelect,
      });

      // Create inventory movement (outflow) for each item
      for (const it of body.items) {
        await tx.inventoryMovement.create({
          data: {
            businessId,
            productId: it.productId,
            branchId: body.branchId ?? null,
            movementType: 'sale',
            quantityDelta: -it.quantity,
            unitCost: it.unitCost,
            referenceType: 'sale',
            referenceId: newSale.id,
            createdBy: userId,
          },
        });
      }

      // Update customer denormalized totals
      if (body.customerId) {
        await tx.customer.update({
          where: { id: body.customerId },
          data: {
            totalSpent: { increment: totalAmount },
            lastPurchaseAt: new Date(),
          },
        });
      }

      return newSale;
    });

    sendCreated(res, formatSale(sale as unknown as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
}

// ─── PUT /sales/:id/void ───────────────────────────────────────────────────────

export async function voidSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const sale = await prisma.sale.findFirst({ where: { id, businessId } });
    if (!sale) throw new AppError('Sale not found.', 404);
    if (sale.status !== 'completed') throw new AppError('Only completed sales can be voided.', 400);

    await prisma.sale.update({ where: { id }, data: { status: 'voided' } });

    sendSuccess(res, { message: 'Sale voided successfully.' });
  } catch (err) {
    next(err);
  }
}
