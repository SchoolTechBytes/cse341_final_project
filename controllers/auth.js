import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { SESSION_COOKIE } from '../middleware/sessionAuth.js';

const SESSION_TTL_MS = 1.5 * 60 * 60 * 1000;
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

const issueSession = async (res, userId) => {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await Session.create({
        _id: crypto.randomUUID(),
        userId,
        expiresAt
    });

    res.cookie(SESSION_COOKIE, session._id, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'lax'
    });
};

export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, passwordHash, authProvider: 'local', role: 'customer' });
        await issueSession(res, user._id);

        const { passwordHash: _omit, ...userResponse } = user.toObject();
        res.status(201).json(userResponse);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, authProvider: 'local' });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        await issueSession(res, user._id);

        const { passwordHash: _omit, ...userResponse } = user.toObject();
        res.status(200).json(userResponse);
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.[SESSION_COOKIE];
        if (sessionId) {
            await Session.deleteOne({ _id: sessionId });
        }
        res.clearCookie(SESSION_COOKIE);
        res.status(200).json({ message: 'Logged out' });
    } catch (err) {
        next(err);
    }
};

export const me = (req, res) => {
    res.status(200).json(req.user);
};

export const githubCallback = async (req, res, next) => {
    try {
        await issueSession(res, req.user._id);
        res.redirect('/');
    } catch (err) {
        next(err);
    }
};
