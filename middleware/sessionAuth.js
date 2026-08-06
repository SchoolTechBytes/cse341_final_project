import Session from '../models/Session.js';
import User from '../models/User.js';

export const SESSION_COOKIE = 'sid';

export const sessionAuth = async (req, res, next) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];

    if (!sessionId) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    try {
        const session = await Session.findById(sessionId);

        if (!session || session.expiresAt <= new Date()) {
            if (session) {
                await Session.deleteOne({ _id: sessionId });
            }
            res.clearCookie(SESSION_COOKIE);
            return res.status(401).json({ error: 'Unauthorized. Please log in.' });
        }

        session.lastSeenAt = new Date();
        await session.save();

        const user = await User.findById(session.userId).select('-passwordHash');
        if (!user) {
            await Session.deleteOne({ _id: sessionId });
            res.clearCookie(SESSION_COOKIE);
            return res.status(401).json({ error: 'Unauthorized. Please log in.' });
        }

        req.userId = session.userId;
        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};
