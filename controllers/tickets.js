import mongoose from 'mongoose';
import Tickets from '../models/Ticket.js';
import TicketHistory from '../models/TicketHistory.js';
import Users from '../models/User.js';

export const createTicket = async (req, res, next) => {
    try {
        const { title, description } = req.body;

        const assignee = await Users.findOne({ role: 'support' }).sort({ lastAssignedAt: 1 });
        if (!assignee) {
            return res.status(503).json({ error: 'No support users available to assign this ticket to' });
        }

        let ticket;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const created = await Tickets.create(
                    [{ title, description, createdBy: req.userId, assignedTo: assignee._id }],
                    { session }
                );
                ticket = created[0];
                assignee.lastAssignedAt = new Date();
                await assignee.save({ session });
            });
        } catch (txErr) {
            // Standalone MongoDB (no replica set) doesn't support transactions; fall back to sequential writes.
            ticket = await Tickets.create({ title, description, createdBy: req.userId, assignedTo: assignee._id });
            assignee.lastAssignedAt = new Date();
            await assignee.save();
        } finally {
            await session.endSession();
        }

        res.status(201).json(ticket);
    } catch (err) {
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

        if (req.user.role === 'customer') {
            filter.createdBy = req.userId;
        }

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
        if (req.user.role === 'customer' && String(ticket.createdBy) !== String(req.userId)) {
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

const STATUS_TRANSITIONS = {
    new: ['in_progress', 'rejected'],
    in_progress: ['rejected', 'closed'],
    rejected: ['closed'],
    closed: ['new', 'in_progress', 'rejected']
};

export const updateTicketStatus = async (req, res, next) => {
    try {
        const ticket = await Tickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const oldStatus = ticket.status;
        const newStatus = req.body.status;

        if (oldStatus !== newStatus && !STATUS_TRANSITIONS[oldStatus]?.includes(newStatus)) {
            return res.status(400).json({ error: `Cannot transition status from '${oldStatus}' to '${newStatus}'` });
        }
        if (oldStatus === 'closed' && newStatus !== oldStatus && !['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden. Reopening a closed ticket requires manager or admin.' });
        }

        ticket.status = newStatus;
        ticket.closedAt = ['closed', 'rejected'].includes(newStatus) ? new Date() : null;

        await ticket.save();

        if (oldStatus !== ticket.status) {
            await TicketHistory.create({
                ticketId: ticket._id,
                changedBy: req.userId,
                fieldChanged: 'status',
                oldValue: oldStatus,
                newValue: ticket.status
            });
        }

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
        const existing = await Tickets.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        const oldAssignedTo = existing.assignedTo;

        const ticket = await Tickets.findByIdAndUpdate(
            req.params.id,
            { assignedTo: req.body.assignedTo },
            { new: true, runValidators: true }
        );

        if (String(oldAssignedTo) !== String(ticket.assignedTo)) {
            await TicketHistory.create({
                ticketId: ticket._id,
                changedBy: req.userId,
                fieldChanged: 'assignedTo',
                oldValue: oldAssignedTo ? String(oldAssignedTo) : null,
                newValue: String(ticket.assignedTo)
            });
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
        const existing = await Tickets.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        const oldPriority = existing.priority;

        const ticket = await Tickets.findByIdAndUpdate(
            req.params.id,
            { priority: req.body.priority },
            { new: true, runValidators: true }
        );

        if (oldPriority !== ticket.priority) {
            await TicketHistory.create({
                ticketId: ticket._id,
                changedBy: req.userId,
                fieldChanged: 'priority',
                oldValue: oldPriority,
                newValue: ticket.priority
            });
        }

        res.status(200).json(ticket);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        next(err);
    }
};

export const getTicketStats = async (req, res, next) => {
    try {
        const [result] = await Tickets.aggregate([
            {
                $facet: {
                    byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                    byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }]
                }
            }
        ]);

        const toCountMap = (rows) => rows.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {});

        res.status(200).json({
            byStatus: toCountMap(result.byStatus),
            byPriority: toCountMap(result.byPriority)
        });
    } catch (err) {
        next(err);
    }
};
