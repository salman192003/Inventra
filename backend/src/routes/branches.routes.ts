import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branches.controller';

const router = Router();

router.use(authenticate);

router.get('/', getBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
