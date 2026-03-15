import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getForecasts } from '../controllers/forecasts.controller';

const router = Router();

router.use(authenticate);

router.get('/', getForecasts);

export default router;
