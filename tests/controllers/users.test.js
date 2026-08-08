import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRes, mockNext } from '../helpers/mockExpress.js';

jest.unstable_mockModule('../../models/User.js', () => ({
    default: { find: jest.fn(), findById: jest.fn() }
}));
jest.unstable_mockModule('../../models/Ticket.js', () => ({
    default: { find: jest.fn() }
}));

const Users = (await import('../../models/User.js')).default;
const Tickets = (await import('../../models/Ticket.js')).default;
const { getAllUsers, getUserById, getUserTickets } = await import('../../controllers/users.js');

const selectMock = (result) => {
    const select = jest.fn();
    if (result instanceof Error) {
        select.mockRejectedValue(result);
    } else {
        select.mockResolvedValue(result);
    }
    return { select };
};

describe('users controller - getAllUsers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds a filter from name/email query params', async () => {
        Users.find.mockReturnValue(selectMock([]));
        const req = { query: { name: 'Alice', email: 'alice@example.com' } };
        const res = mockRes();
        const next = mockNext();

        await getAllUsers(req, res, next);

        expect(Users.find).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 200 with an empty array when there are no users', async () => {
        Users.find.mockReturnValue(selectMock([]));
        const req = { query: {} };
        const res = mockRes();
        const next = mockNext();

        await getAllUsers(req, res, next);

        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('forwards errors to next', async () => {
        const dbError = new Error('db down');
        Users.find.mockReturnValue(selectMock(dbError));
        const req = { query: {} };
        const res = mockRes();
        const next = mockNext();

        await getAllUsers(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});

describe('users controller - getUserById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows a non-privileged user to fetch their own record', async () => {
        const user = { _id: 'u1', name: 'Alice' };
        Users.findById.mockReturnValue(selectMock(user));
        const req = { params: { id: 'u1' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(user);
    });

    it('returns 403 for a non-privileged user requesting someone else\'s record', async () => {
        const req = { params: { id: 'other' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden.' });
        expect(Users.findById).not.toHaveBeenCalled();
    });

    it.each(['support', 'manager', 'admin'])(
        'allows a privileged %s role to fetch another user\'s record',
        async (role) => {
            const user = { _id: 'other', name: 'Bob' };
            Users.findById.mockReturnValue(selectMock(user));
            const req = { params: { id: 'other' }, user: { _id: 'u1', role } };
            const res = mockRes();
            const next = mockNext();

            await getUserById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(user);
        }
    );

    it('returns 404 when the user is not found', async () => {
        Users.findById.mockReturnValue(selectMock(null));
        const req = { params: { id: 'u1' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns 404 on a CastError', async () => {
        Users.findById.mockReturnValue({ select: jest.fn().mockRejectedValue({ name: 'CastError' }) });
        const req = { params: { id: 'bad-id' }, user: { _id: 'bad-id', role: 'admin' } };
        const res = mockRes();
        const next = mockNext();

        await getUserById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('forwards non-CastError failures to next', async () => {
        const dbError = new Error('db down');
        Users.findById.mockReturnValue(selectMock(dbError));
        const req = { params: { id: 'u1' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserById(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});

describe('users controller - getUserTickets', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows a non-privileged user to fetch their own tickets', async () => {
        Tickets.find.mockResolvedValue([{ _id: 't1' }]);
        const req = { params: { id: 'u1' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserTickets(req, res, next);

        expect(Tickets.find).toHaveBeenCalledWith({
            $or: [{ createdBy: 'u1' }, { assignedTo: 'u1' }]
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 403 for a non-privileged user requesting someone else\'s tickets', async () => {
        const req = { params: { id: 'other' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserTickets(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden.' });
        expect(Tickets.find).not.toHaveBeenCalled();
    });

    it.each(['support', 'manager', 'admin'])(
        'allows a privileged %s role to fetch another user\'s tickets',
        async (role) => {
            Tickets.find.mockResolvedValue([]);
            const req = { params: { id: 'other' }, user: { _id: 'u1', role } };
            const res = mockRes();
            const next = mockNext();

            await getUserTickets(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        }
    );

    it('returns 200 with an empty array when the user has no tickets', async () => {
        Tickets.find.mockResolvedValue([]);
        const req = { params: { id: 'u1' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserTickets(req, res, next);

        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 404 with "User not found" on a CastError', async () => {
        Tickets.find.mockRejectedValue({ name: 'CastError' });
        const req = { params: { id: 'bad-id' }, user: { _id: 'bad-id', role: 'admin' } };
        const res = mockRes();
        const next = mockNext();

        await getUserTickets(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('forwards non-CastError failures to next', async () => {
        const dbError = new Error('db down');
        Tickets.find.mockRejectedValue(dbError);
        const req = { params: { id: 'u1' }, user: { _id: 'u1', role: 'customer' } };
        const res = mockRes();
        const next = mockNext();

        await getUserTickets(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});
