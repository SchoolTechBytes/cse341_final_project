import express from 'express';
import { checkValidation } from '../middleware/checkValidation.js';
import { ensureAuth } from '../middleware/ensureAuth.js';

const router = express.Router();

router.get('/users',);
router.get('/users/:id',);
router.post('/users',);
router.put('/users/:id',);
router.put('/users/:id/role',);
router.delete('/users/:id',);

export default router;