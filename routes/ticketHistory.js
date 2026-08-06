import express from 'express';
import { getTicketHistory } from '../controllers/ticketHistory.js';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.get('/:id/history', sessionAuth, requireRole('support', 'manager', 'admin'), getTicketHistory);

export default router;
