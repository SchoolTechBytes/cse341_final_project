import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRes, mockNext } from '../helpers/mockExpress.js';

jest.unstable_mockModule('../../models/Ticket.js', () => ({
    default: { find: jest.fn(), findById: jest.fn(), aggregate: jest.fn() }
}));
jest.unstable_mockModule('../../models/TicketHistory.js', () => ({
    default: {}
}));
jest.unstable_mockModule('../../models/User.js', () => ({
    default: {}
}));

const Tickets = (await import('../../models/Ticket.js')).default;
const { getAllTickets, getTicketById, getTicketStats } = await import('../../controllers/tickets.js');

describe('tickets controller - getAllTickets', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds a filter from query params for a non-customer role', async () => {
        Tickets.find.mockResolvedValue([]);
        const req = {
            query: { status: 'new', priority: 'high', assignedTo: 'u1', createdBy: 'u2' },
            user: { role: 'support' },
            userId: 'u3'
        };
        const res = mockRes();
        const next = mockNext();

        await getAllTickets(req, res, next);

        expect(Tickets.find).toHaveBeenCalledWith({
            status: 'new',
            priority: 'high',
            assignedTo: 'u1',
            createdBy: 'u2'
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forces createdBy to the requesting user for the customer role, overriding the query param', async () => {
        Tickets.find.mockResolvedValue([]);
        const req = {
            query: { createdBy: 'someone-else' },
            user: { role: 'customer' },
            userId: 'me'
        };
        const res = mockRes();
        const next = mockNext();

        await getAllTickets(req, res, next);

        expect(Tickets.find).toHaveBeenCalledWith({ createdBy: 'me' });
    });

    it('returns 200 with an empty array when there are no tickets', async () => {
        Tickets.find.mockResolvedValue([]);
        const req = { query: {}, user: { role: 'admin' }, userId: 'u1' };
        const res = mockRes();
        const next = mockNext();

        await getAllTickets(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('forwards errors to next', async () => {
        const dbError = new Error('db down');
        Tickets.find.mockRejectedValue(dbError);
        const req = { query: {}, user: { role: 'admin' }, userId: 'u1' };
        const res = mockRes();
        const next = mockNext();

        await getAllTickets(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});

describe('tickets controller - getTicketById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 404 when the ticket does not exist', async () => {
        Tickets.findById.mockResolvedValue(null);
        const req = { params: { id: 't1' }, user: { role: 'admin' }, userId: 'u1' };
        const res = mockRes();
        const next = mockNext();

        await getTicketById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
    });

    it('masks another user\'s ticket as 404 for a customer (does not leak existence via 403)', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1', createdBy: 'other-user' });
        const req = { params: { id: 't1' }, user: { role: 'customer' }, userId: 'me' };
        const res = mockRes();
        const next = mockNext();

        await getTicketById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
    });

    it('returns 200 for a customer viewing their own ticket', async () => {
        const ticket = { _id: 't1', createdBy: 'me' };
        Tickets.findById.mockResolvedValue(ticket);
        const req = { params: { id: 't1' }, user: { role: 'customer' }, userId: 'me' };
        const res = mockRes();
        const next = mockNext();

        await getTicketById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(ticket);
    });

    it.each(['support', 'manager', 'admin'])(
        'returns 200 for a %s role regardless of createdBy',
        async (role) => {
            const ticket = { _id: 't1', createdBy: 'someone-else' };
            Tickets.findById.mockResolvedValue(ticket);
            const req = { params: { id: 't1' }, user: { role }, userId: 'me' };
            const res = mockRes();
            const next = mockNext();

            await getTicketById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(ticket);
        }
    );

    it('returns 404 on a CastError', async () => {
        Tickets.findById.mockRejectedValue({ name: 'CastError' });
        const req = { params: { id: 'bad-id' }, user: { role: 'admin' }, userId: 'u1' };
        const res = mockRes();
        const next = mockNext();

        await getTicketById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
    });

    it('forwards non-CastError failures to next', async () => {
        const dbError = new Error('db down');
        Tickets.findById.mockRejectedValue(dbError);
        const req = { params: { id: 't1' }, user: { role: 'admin' }, userId: 'u1' };
        const res = mockRes();
        const next = mockNext();

        await getTicketById(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});

describe('tickets controller - getTicketStats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reduces aggregate facet results into count maps', async () => {
        Tickets.aggregate.mockResolvedValue([
            {
                byStatus: [{ _id: 'new', count: 3 }, { _id: 'closed', count: 1 }],
                byPriority: [{ _id: 'high', count: 2 }]
            }
        ]);
        const req = {};
        const res = mockRes();
        const next = mockNext();

        await getTicketStats(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            byStatus: { new: 3, closed: 1 },
            byPriority: { high: 2 }
        });
    });

    it('returns empty count maps when there are no tickets', async () => {
        Tickets.aggregate.mockResolvedValue([{ byStatus: [], byPriority: [] }]);
        const req = {};
        const res = mockRes();
        const next = mockNext();

        await getTicketStats(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ byStatus: {}, byPriority: {} });
    });

    it('forwards errors to next', async () => {
        const dbError = new Error('db down');
        Tickets.aggregate.mockRejectedValue(dbError);
        const req = {};
        const res = mockRes();
        const next = mockNext();

        await getTicketStats(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});
