import express from 'express';
import { checkValidation } from '../middleware/checkValidation.js';
import { ensureAuth } from '../middleware/ensureAuth.js';

const router = express.Router();

router.get('/users', ensureAuth);
router.get('/users/:id', ensureAuth);
router.post('/users', ensureAuth);
router.put('users/:id', ensureAuth);
router.put('/users/:id/role', ensureAuth);
router.delete('users/:id', ensureAuth);

export default router;