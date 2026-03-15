import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getStockLevels, getInventoryMovements, adjustStock } from '../controllers/inventory.controller';

const router = Router();

router.use(authenticate);

router.get('/stock', getStockLevels);
router.get('/movements', getInventoryMovements);
router.post('/movements', adjustStock);

export default router;
