import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenses.controller';

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
