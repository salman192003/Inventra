import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createBranchSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateBranchSchema = createBranchSchema.partial();

// ─── GET /branches ─────────────────────────────────────────────────────────────

export async function getBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;

    const branches = await prisma.branch.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, address: true, phone: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, branches);
  } catch (err) {
    next(err);
  }
}

// ─── POST /branches ────────────────────────────────────────────────────────────

export async function createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const body = createBranchSchema.parse(req.body);

    const branch = await prisma.branch.create({
      data: {
        businessId,
        name: body.name,
        address: body.address,
        phone: body.phone,
      },
      select: { id: true, name: true, address: true, phone: true, isActive: true },
    });

    sendCreated(res, branch);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /branches/:id ─────────────────────────────────────────────────────────

export async function updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const body = updateBranchSchema.parse(req.body);

    const existing = await prisma.branch.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Branch not found.', 404);

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.phone !== undefined && { phone: body.phone }),
      },
      select: { id: true, name: true, address: true, phone: true, isActive: true },
    });

    sendSuccess(res, branch);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /branches/:id ──────────────────────────────────────────────────────

export async function deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.branch.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError('Branch not found.', 404);

    await prisma.branch.update({ where: { id }, data: { isActive: false } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
