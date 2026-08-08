import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRes, mockNext } from '../helpers/mockExpress.js';

jest.unstable_mockModule('../../models/Ticket.js', () => ({
    default: { findById: jest.fn() }
}));
jest.unstable_mockModule('../../models/TicketHistory.js', () => ({
    default: { find: jest.fn() }
}));

const Tickets = (await import('../../models/Ticket.js')).default;
const TicketHistory = (await import('../../models/TicketHistory.js')).default;
const { getTicketHistory } = await import('../../controllers/ticketHistory.js');

const sortMock = (result) => {
    const sort = jest.fn();
    if (result instanceof Error) {
        sort.mockRejectedValue(result);
    } else {
        sort.mockResolvedValue(result);
    }
    return { sort };
};

describe('ticketHistory controller - getTicketHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 404 when the ticket does not exist', async () => {
        Tickets.findById.mockResolvedValue(null);
        const req = { params: { id: 't1' } };
        const res = mockRes();
        const next = mockNext();

        await getTicketHistory(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
    });

    it('returns 404 on a CastError from findById', async () => {
        Tickets.findById.mockRejectedValue({ name: 'CastError' });
        const req = { params: { id: 'bad-id' } };
        const res = mockRes();
        const next = mockNext();

        await getTicketHistory(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
    });

    it('returns 200 with the history entries on the happy path', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1' });
        const history = [{ fieldChanged: 'status', oldValue: 'new', newValue: 'in_progress' }];
        TicketHistory.find.mockReturnValue(sortMock(history));
        const req = { params: { id: 't1' } };
        const res = mockRes();
        const next = mockNext();

        await getTicketHistory(req, res, next);

        expect(TicketHistory.find).toHaveBeenCalledWith({ ticketId: 't1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(history);
    });

    it('returns 200 with an empty array when there is no history', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1' });
        TicketHistory.find.mockReturnValue(sortMock([]));
        const req = { params: { id: 't1' } };
        const res = mockRes();
        const next = mockNext();

        await getTicketHistory(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('forwards non-CastError failures to next', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1' });
        const dbError = new Error('db down');
        TicketHistory.find.mockReturnValue(sortMock(dbError));
        const req = { params: { id: 't1' } };
        const res = mockRes();
        const next = mockNext();

        await getTicketHistory(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
        expect(res.status).not.toHaveBeenCalled();
    });
});
