import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getSales, getSale, createSale, voidSale } from '../controllers/sales.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', createSale);
router.put('/:id/void', voidSale);

export default router;
