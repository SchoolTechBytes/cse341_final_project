import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRes, mockNext } from '../helpers/mockExpress.js';

jest.unstable_mockModule('../../models/Ticket.js', () => ({
    default: { findById: jest.fn() }
}));
jest.unstable_mockModule('../../models/Comment.js', () => ({
    default: { find: jest.fn() }
}));

const Tickets = (await import('../../models/Ticket.js')).default;
const Comments = (await import('../../models/Comment.js')).default;
const { getCommentsForTicket } = await import('../../controllers/comments.js');

const sortMock = (result) => {
    const sort = jest.fn();
    if (result instanceof Error) {
        sort.mockRejectedValue(result);
    } else {
        sort.mockResolvedValue(result);
    }
    return { sort };
};

describe('comments controller - getCommentsForTicket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 404 when the ticket does not exist', async () => {
        Tickets.findById.mockResolvedValue(null);
        const req = { params: { id: 't1' }, user: { role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getCommentsForTicket(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 on a CastError from findById', async () => {
        Tickets.findById.mockRejectedValue({ name: 'CastError' });
        const req = { params: { id: 'bad-id' }, user: { role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getCommentsForTicket(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
    });

    it('filters out internal comments for a non-privileged (customer) role', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1' });
        Comments.find.mockReturnValue(sortMock([{ body: 'hi' }]));
        const req = { params: { id: 't1' }, user: { role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getCommentsForTicket(req, res, next);

        expect(Comments.find).toHaveBeenCalledWith({ ticketId: 't1', isInternal: false });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ body: 'hi' }]);
    });

    it.each(['support', 'manager', 'admin'])(
        'does not filter internal comments for privileged role %s',
        async (role) => {
            Tickets.findById.mockResolvedValue({ _id: 't1' });
            Comments.find.mockReturnValue(sortMock([]));
            const req = { params: { id: 't1' }, user: { role } };
            const res = mockRes();
            const next = mockNext();

            await getCommentsForTicket(req, res, next);

            expect(Comments.find).toHaveBeenCalledWith({ ticketId: 't1' });
        }
    );

    it('returns 200 with an empty array when there are no comments', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1' });
        Comments.find.mockReturnValue(sortMock([]));
        const req = { params: { id: 't1' }, user: { role: 'admin' } };
        const res = mockRes();
        const next = mockNext();

        await getCommentsForTicket(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('forwards non-CastError failures to next', async () => {
        Tickets.findById.mockResolvedValue({ _id: 't1' });
        const dbError = new Error('db down');
        Comments.find.mockReturnValue(sortMock(dbError));
        const req = { params: { id: 't1' }, user: { role: 'admin' } };
        const res = mockRes();
        const next = mockNext();

        await getCommentsForTicket(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
        expect(res.status).not.toHaveBeenCalled();
    });
});
