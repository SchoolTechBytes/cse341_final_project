import express from 'express';
import { getAllTickets } from '../controllers/tickets.js';
import { validateTicket } from '../middleware/validateTicket.js';
import { checkValidation } from '../middleware/checkValidation.js';
import { ensureAuth } from '../middleware/ensureAuth.js';

const router = express.Router();

router.post('/tickets', ensureAuth, validateTicket, checkValidation);
router.get('/tickets', ensureAuth, getAllTickets);
router.get('/tickets/:id', ensureAuth);
router.put('tickets/:id/status', ensureAuth, validateTicket, checkValidation);
router.put('/tickets/:id/assign', ensureAuth, validateTicket, checkValidation);
router.put('tickets/:id/priorty', ensureAuth, validateTicket, checkValidation);

export default router;