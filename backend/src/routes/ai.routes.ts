import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// ── Retrieval Endpoints ────────────────────────────────────────────────────
router.get('/insights', authenticate, aiController.getInsights);
router.get('/business-analysis', authenticate, aiController.getBusinessAnalysis);
router.get('/inventory-analysis', authenticate, aiController.getInventoryAnalysis);
router.get('/expense-analysis', authenticate, aiController.getExpenseAnalysis);

// ── Report Generation ──────────────────────────────────────────────────────
router.get('/report', authenticate, aiController.generateReport);

// ── Trigger Endpoints ──────────────────────────────────────────────────────
router.post('/forecast/trigger', authenticate, aiController.triggerForecasting);
router.post('/insights/trigger', authenticate, aiController.triggerInsights);

// ── Recommendation Actions ─────────────────────────────────────────────────
router.patch('/recommendations/:id/status', authenticate, aiController.updateRecommendationStatus);

export default router;
