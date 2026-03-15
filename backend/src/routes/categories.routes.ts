import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
