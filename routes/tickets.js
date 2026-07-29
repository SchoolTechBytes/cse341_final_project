import express from 'express';
import {
    createTicket,
    getAllTickets,
    getTicketById,
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
import { ensureAuth } from '../middleware/ensureAuth.js';

const router = express.Router();

router.post('/', validateCreateTicket, checkValidation, createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.put('/:id/status', validateTicketStatus, checkValidation, updateTicketStatus);
router.put('/:id/assign', validateTicketAssign, checkValidation, assignTicketToSupport);
router.put('/:id/priority', validateTicketPriority, checkValidation, setTicketPriority);

export default router;