import Tickets from '../models/Ticket.js';

export const createTicket = async (req, res, next) => {
    try {
        const { title, description, createdBy, priority } = req.body;
        const ticket = await Tickets.create({ title, description, createdBy, priority });
        res.status(201).json(ticket);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid createdBy id' });
        }
        next(err);
    }
};

export const getAllTickets = async (req, res, next) => {
    try {
        const { status, priority, assignedTo, createdBy } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (createdBy) filter.createdBy = createdBy;

        const tickets = await Tickets.find(filter);
        res.status(200).json(tickets);
    } catch (err) {
        next(err);
    }
};

export const getTicketById = async (req, res, next) => {
    try {
        const ticket = await Tickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.status(200).json(ticket);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};

export const updateTicketStatus = async (req, res, next) => {
    try {
        const ticket = await Tickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        ticket.status = req.body.status;
        ticket.closedAt = ['closed', 'rejected'].includes(req.body.status) ? new Date() : null;

        await ticket.save();
        res.status(200).json(ticket);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};

export const assignTicketToSupport = async (req, res, next) => {
    try {
        const ticket = await Tickets.findByIdAndUpdate(
            req.params.id,
            { assignedTo: req.body.assignedTo },
            { new: true, runValidators: true }
        );
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.status(200).json(ticket);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};

export const setTicketPriority = async (req, res, next) => {
    try {
        const ticket = await Tickets.findByIdAndUpdate(
            req.params.id,
            { priority: req.body.priority },
            { new: true, runValidators: true }
        );
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.status(200).json(ticket);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};
