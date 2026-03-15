import { Router, Request, Response } from 'express';
import { runForecast } from '../services/forecastService';

export const forecastRouter = Router();

/**
 * POST /forecast/run
 * Body: { businessId, productId, branchId? }
 * Reads sale history from DB, runs demand forecast, writes result to forecasts table.
 */
forecastRouter.post('/run', async (req: Request, res: Response) => {
  try {
    const { businessId, productId, branchId } = req.body as {
      businessId: string;
      productId: string;
      branchId?: string;
    };

    const forecast = await runForecast({ businessId, productId, branchId });
    res.json({ success: true, data: forecast });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});
