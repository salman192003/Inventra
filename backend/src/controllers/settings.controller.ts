import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const updateSettingsSchema = z.object({
  // Business fields
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  country: z.string().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  // Settings fields
  lowStockThreshold: z.number().int().min(0).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  fiscalYearStart: z.number().int().min(1).max(12).optional(),
});

// ─── GET /settings ───────────────────────────────────────────────────────────

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new AppError('Business not found.', 404);

    const settings = await prisma.settings.findUnique({ where: { businessId } });

    sendSuccess(res, {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        country: business.country,
        currency: business.currency,
        timezone: business.timezone,
      },
      settings: {
        lowStockThreshold: settings?.lowStockThresholdDefault ?? 10,
        defaultTaxRate: settings?.defaultTaxRate ? Number(settings.defaultTaxRate) : 0,
        fiscalYearStart: settings?.fiscalYearStartMonth ?? 1,
      },
    });
  } catch (err) { next(err); }
}

// ─── PUT /settings ───────────────────────────────────────────────────────────

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.user!;
    const body = updateSettingsSchema.parse(req.body);

    // Separate business vs settings fields
    const businessFields: Record<string, unknown> = {};
    const settingsFields: Record<string, unknown> = {};

    if (body.name !== undefined) businessFields.name = body.name;
    if (body.email !== undefined) businessFields.email = body.email;
    if (body.country !== undefined) businessFields.country = body.country;
    if (body.currency !== undefined) businessFields.currency = body.currency;
    if (body.timezone !== undefined) businessFields.timezone = body.timezone;

    if (body.lowStockThreshold !== undefined) settingsFields.lowStockThresholdDefault = body.lowStockThreshold;
    if (body.defaultTaxRate !== undefined) settingsFields.defaultTaxRate = body.defaultTaxRate;
    if (body.fiscalYearStart !== undefined) settingsFields.fiscalYearStartMonth = body.fiscalYearStart;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(businessFields).length > 0) {
        await tx.business.update({ where: { id: businessId }, data: businessFields });
      }
      if (Object.keys(settingsFields).length > 0) {
        await tx.settings.upsert({
          where: { businessId },
          update: settingsFields,
          create: { businessId, ...settingsFields as any },
        });
      }
    });

    // Return updated data
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    const settings = await prisma.settings.findUnique({ where: { businessId } });

    sendSuccess(res, {
      business: {
        id: business!.id,
        name: business!.name,
        slug: business!.slug,
        email: business!.email,
        country: business!.country,
        currency: business!.currency,
        timezone: business!.timezone,
      },
      settings: {
        lowStockThreshold: settings?.lowStockThresholdDefault ?? 10,
        defaultTaxRate: settings?.defaultTaxRate ? Number(settings.defaultTaxRate) : 0,
        fiscalYearStart: settings?.fiscalYearStartMonth ?? 1,
      },
    });
  } catch (err) { next(err); }
}
