import express from 'express';
import {
    createTicket,
    getAllTickets,
    getTicketById,
    getTicketStats,
    updateTicketStatus,
    assignTicketToSupport,
    setTicketPriority
} from '../controllers/tickets.js';
import {
    validateCreateTicket,
    validateTicketStatus,
    validateTicketAssign,
    validateTicketPriority
} from '../middleware/validateTicket.js';
import { checkValidation } from '../middleware/checkValidation.js';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.post('/', sessionAuth, validateCreateTicket, checkValidation, createTicket);
router.get('/', sessionAuth, getAllTickets);
router.get('/stats', sessionAuth, requireRole('support', 'manager', 'admin'), getTicketStats);
router.get('/:id', sessionAuth, getTicketById);
router.put('/:id/status', sessionAuth, requireRole('support', 'manager', 'admin'), validateTicketStatus, checkValidation, updateTicketStatus);
router.put('/:id/assign', sessionAuth, requireRole('manager', 'admin'), validateTicketAssign, checkValidation, assignTicketToSupport);
router.put('/:id/priority', sessionAuth, requireRole('support', 'manager', 'admin'), validateTicketPriority, checkValidation, setTicketPriority);

export default router;