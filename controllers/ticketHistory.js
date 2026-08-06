import TicketHistory from '../models/TicketHistory.js';
import Tickets from '../models/Ticket.js';

export const getTicketHistory = async (req, res, next) => {
    try {
        const ticket = await Tickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const history = await TicketHistory.find({ ticketId: req.params.id }).sort({ changedAt: 1 });
        res.status(200).json(history);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};
