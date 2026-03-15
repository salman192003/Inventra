import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getCustomers, getCustomer, getCustomerSales, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.get('/:id/sales', getCustomerSales);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
