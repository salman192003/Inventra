import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

// ─── GET /suppliers ────────────────────────────────────────────────────────────

export async function getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { search, isActive } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {
      businessId,
      ...(isActive === undefined ? {} : { isActive: isActive === 'true' }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { contactName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const suppliers = await prisma.supplier.findMany({
      where,
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, suppliers);
  } catch (err) {
    next(err);
  }
}

// ─── GET /suppliers/:id ────────────────────────────────────────────────────────

export async function getSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({
      where: { id, businessId },
      select: {
        id: true, name: true, contactName: true, email: true, phone: true,
        address: true, notes: true, isActive: true, createdAt: true,
        products: { select: { id: true, name: true, sku: true }, take: 20 },
      },
    });

    if (!supplier) throw new AppError('Supplier not found.', 404);

    sendSuccess(res, supplier);
  } catch (err) {
    next(err);
  }
}

// ─── POST /suppliers ───────────────────────────────────────────────────────────

export async function createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const body = createSupplierSchema.parse(req.body);

    const supplier = await prisma.supplier.create({
      data: {
        businessId,
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        notes: body.notes,
      },
      select: { id: true, name: true, contactName: true, email: true, phone: true, address: true, isActive: true },
    });

    sendCreated(res, supplier);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /suppliers/:id ────────────────────────────────────────────────────────

export async function updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const body = updateSupplierSchema.parse(req.body);

    const existing = await prisma.supplier.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Supplier not found.', 404);

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.contactName !== undefined && { contactName: body.contactName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      select: { id: true, name: true, contactName: true, email: true, phone: true, address: true, isActive: true },
    });

    sendSuccess(res, supplier);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /suppliers/:id ─────────────────────────────────────────────────────

export async function deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.supplier.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Supplier not found.', 404);

    // Soft delete to preserve product links
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
