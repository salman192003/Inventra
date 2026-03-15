import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createCustomerSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const updateCustomerSchema = createCustomerSchema.partial();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const customerSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  address: true,
  notes: true,
  tags: true,
  totalSpent: true,
  lastPurchaseAt: true,
  createdAt: true,
};

// ─── GET /customers ────────────────────────────────────────────────────────────

export async function getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { search, page = '1', limit = '50' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      businessId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          ...customerSelect,
          _count: { select: { sales: { where: { status: 'completed' } } } },
        },
        orderBy: { totalSpent: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.customer.count({ where }),
    ]);

    const mapped = customers.map(({ _count, ...c }) => ({
      ...c,
      totalSpent: Number(c.totalSpent),
      orderCount: _count.sales,
      lastOrderDate: c.lastPurchaseAt?.toISOString() ?? null,
    }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── GET /customers/:id ────────────────────────────────────────────────────────

export async function getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id, businessId },
      select: {
        ...customerSelect,
        _count: { select: { sales: { where: { status: 'completed' } } } },
      },
    });

    if (!customer) throw new AppError('Customer not found.', 404);

    const { _count, ...rest } = customer;

    sendSuccess(res, {
      ...rest,
      totalSpent: Number(rest.totalSpent),
      orderCount: _count.sales,
      lastOrderDate: rest.lastPurchaseAt?.toISOString() ?? null,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /customers/:id/sales ─────────────────────────────────────────────────

export async function getCustomerSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    const customer = await prisma.customer.findFirst({ where: { id, businessId } });
    if (!customer) throw new AppError('Customer not found.', 404);

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { customerId: id, businessId },
        select: {
          id: true,
          saleDate: true,
          totalAmount: true,
          paymentMethod: true,
          status: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { saleDate: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.sale.count({ where: { customerId: id, businessId } }),
    ]);

    const mapped = sales.map((s) => ({
      ...s,
      totalAmount: Number(s.totalAmount),
      items: s.items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    }));

    sendSuccess(res, mapped, 200, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── POST /customers ───────────────────────────────────────────────────────────

export async function createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const body = createCustomerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        businessId,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        notes: body.notes,
        tags: body.tags,
      },
      select: customerSelect,
    });

    sendCreated(res, { ...customer, totalSpent: Number(customer.totalSpent), orderCount: 0, lastOrderDate: null });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /customers/:id ────────────────────────────────────────────────────────

export async function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const body = updateCustomerSchema.parse(req.body);

    const existing = await prisma.customer.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Customer not found.', 404);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
      select: customerSelect,
    });

    sendSuccess(res, { ...customer, totalSpent: Number(customer.totalSpent) });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /customers/:id ─────────────────────────────────────────────────────

export async function deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.customer.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Customer not found.', 404);

    await prisma.customer.delete({ where: { id } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
