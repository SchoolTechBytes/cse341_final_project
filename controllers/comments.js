import Comments from '../models/Comment.js';
import Tickets from '../models/Ticket.js';

export const getCommentsForTicket = async (req, res, next) => {
    try {
        const ticket = await Tickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const isPrivileged = ['support', 'manager', 'admin'].includes(req.user.role);
        const filter = { ticketId: req.params.id };
        if (!isPrivileged) {
            filter.isInternal = false;
        }

        const comments = await Comments.find(filter).sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};

export const createComment = async (req, res, next) => {
    try {
        const ticket = await Tickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const isPrivileged = ['support', 'manager', 'admin'].includes(req.user.role);
        const isInternal = isPrivileged ? Boolean(req.body.isInternal) : false;

        const comment = await Comments.create({
            ticketId: req.params.id,
            userId: req.userId,
            body: req.body.body,
            isInternal
        });

        res.status(201).json(comment);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};
