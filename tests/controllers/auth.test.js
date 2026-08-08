import { describe, it, expect } from '@jest/globals';
import { mockRes } from '../helpers/mockExpress.js';
import { me } from '../../controllers/auth.js';

describe('auth controller - me', () => {
    it('returns the authenticated user with 200', () => {
        const req = { user: { _id: 'u1', name: 'Alice', role: 'customer' } };
        const res = mockRes();

        me(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(req.user);
    });
});
