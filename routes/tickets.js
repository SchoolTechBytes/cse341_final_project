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

router.post('/tickets', validateCreateTicket, checkValidation, createTicket);
router.get('/tickets', getAllTickets);
router.get('/tickets/:id', getTicketById);
router.put('/tickets/:id/status', validateTicketStatus, checkValidation, updateTicketStatus);
router.put('/tickets/:id/assign', validateTicketAssign, checkValidation, assignTicketToSupport);
router.put('/tickets/:id/priority', validateTicketPriority, checkValidation, setTicketPriority);

export default router;