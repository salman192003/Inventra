import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { hashPassword, verifyPassword, signToken } from '../utils/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  business: z.object({
    name: z.string().min(2).max(255),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    email: z.string().email(),
    country: z.string().min(2),
    currency: z.string().length(3).default('USD'),
    timezone: z.string().default('UTC'),
  }),
  user: z.object({
    fullName: z.string().min(2).max(255),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  businessSlug: z.string().min(1),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userPayload(user: { id: string; email: string; fullName: string; isOwner: boolean; businessId: string }) {
  return { id: user.id, email: user.email, fullName: user.fullName, isOwner: user.isOwner, businessId: user.businessId };
}

function businessPayload(b: { id: string; name: string; slug: string; currency: string; timezone: string; country: string }) {
  return { id: b.id, name: b.name, slug: b.slug, currency: b.currency, timezone: b.timezone, country: b.country };
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: body.business.name,
          slug: body.business.slug,
          email: body.business.email,
          country: body.business.country,
          currency: body.business.currency,
          timezone: body.business.timezone,
        },
      });

      const passwordHash = await hashPassword(body.user.password);
      const user = await tx.user.create({
        data: {
          businessId: business.id,
          email: body.user.email,
          passwordHash,
          fullName: body.user.fullName,
          isOwner: true,
        },
      });

      await tx.settings.create({ data: { businessId: business.id } });

      return { business, user };
    });

    const token = signToken({
      userId: result.user.id,
      businessId: result.business.id,
      email: result.user.email,
    });

    sendCreated(res, {
      token,
      user: userPayload(result.user),
      business: businessPayload(result.business),
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, businessSlug } = loginSchema.parse(req.body);

    const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
    if (!business?.isActive) throw new AppError('Invalid credentials.', 401);

    const user = await prisma.user.findUnique({
      where: { businessId_email: { businessId: business.id, email } },
    });
    if (!user?.isActive) throw new AppError('Invalid credentials.', 401);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials.', 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken({ userId: user.id, businessId: business.id, email: user.email });

    sendSuccess(res, {
      token,
      user: userPayload(user),
      business: businessPayload(business),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isOwner: true,
        businessId: true,
        avatarUrl: true,
        business: {
          select: { id: true, name: true, slug: true, currency: true, timezone: true, country: true },
        },
      },
    });

    if (!user) throw new AppError('User not found.', 404);

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
