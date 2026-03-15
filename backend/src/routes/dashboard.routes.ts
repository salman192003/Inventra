import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDashboardSummary, getRevenueTrend } from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/revenue-trend', getRevenueTrend);

export default router;
