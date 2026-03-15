import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getCashflowSummary, getCashflowEvents } from '../controllers/cashflow.controller';

const router = Router();

router.use(authenticate);

router.get('/summary', getCashflowSummary);
router.get('/', getCashflowEvents);

export default router;
