import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
