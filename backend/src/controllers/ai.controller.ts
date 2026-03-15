import { Request, Response } from 'express';
import { forecastingService } from '../services/ai/forecasting.service';
import { insightEngineService } from '../services/ai/insight-engine.service';
import { aggregatorService } from '../services/ai/aggregator.service';
import { reportService } from '../services/ai/report.service';
import prisma from '../config/prisma';

const FORECAST_API_URL = process.env.FORECAST_API_URL || 'http://localhost:8000';

export const aiController = {
  /**
   * Fetches the latest generated AI insights (Recommendations)
   */
  async getInsights(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId || req.body.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      const recommendations = await prisma.recommendation.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } }
        }
      });

      return res.status(200).json({ data: recommendations });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error fetching insights' });
    }
  },

  /**
   * Fetches advanced business analysis from the ML side
   */
  async getBusinessAnalysis(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId || req.body.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      const analysis = await forecastingService.analyzeBusiness(businessId);
      return res.status(200).json({
        message: 'Business analysis retrieved successfully',
        data: analysis
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error generating business analysis' });
    }
  },

  /**
   * Triggers Prophet demand forecasts for all active products
   */
  async triggerForecasting(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId || req.body.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      res.status(202).json({ message: 'Forecast generation triggered. Running in background.' });

      forecastingService.generateForecastsForBusiness(businessId)
        .then(count => console.log(`Finished forecasting: ${count} successful.`))
        .catch(err => console.error("Forecasting fatal error:", err));
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error triggering forecast' });
    }
  },

  /**
   * Triggers the LLM-based insights generation
   */
  async triggerInsights(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId || req.body.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      const recommendations = await insightEngineService.generateBusinessInsights(businessId);
      return res.status(200).json({
        message: 'Insights generated successfully',
        data: recommendations
      });
    } catch (error: any) {
      console.error('Trigger Insights Error:', error);
      require('fs').writeFileSync('insights_error.log', error.stack || String(error));
      res.status(500).json({ error: 'Server error generating AI insights', details: String(error) });
    }
  },

  /**
   * Runs the inventory analysis through the Python microservice
   */
  async getInventoryAnalysis(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      const payload = await aggregatorService.getInventoryAnalysisPayload(businessId);
      const response = await fetch(`${FORECAST_API_URL}/analyze/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python API responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return res.status(200).json({ data });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error running inventory analysis' });
    }
  },

  /**
   * Runs the expense analysis through the Python microservice
   */
  async getExpenseAnalysis(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      const payload = await aggregatorService.getExpenseAnalysisPayload(businessId);
      const response = await fetch(`${FORECAST_API_URL}/analyze/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python API responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return res.status(200).json({ data });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error running expense analysis' });
    }
  },

  /**
   * Generates a full business report with Gemini-written insights
   */
  async generateReport(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId;
      if (!businessId) return res.status(400).json({ error: 'businessId required.' });

      const reportData = await reportService.generateReportData(businessId);
      return res.status(200).json({ data: reportData });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error generating report' });
    }
  },

  /**
   * Updates a recommendation status (approve/dismiss)
   */
  async updateRecommendationStatus(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId;
      const { id } = req.params;
      const { status } = req.body; // 'acted_on' | 'dismissed' | 'acknowledged'

      if (!businessId) return res.status(400).json({ error: 'businessId required.' });
      if (!['acted_on', 'dismissed', 'acknowledged'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use: acted_on, dismissed, acknowledged' });
      }

      const recommendation = await prisma.recommendation.update({
        where: { id, businessId },
        data: { status }
      });

      return res.status(200).json({
        message: 'Recommendation updated',
        data: recommendation
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server error updating recommendation' });
    }
  }
};
