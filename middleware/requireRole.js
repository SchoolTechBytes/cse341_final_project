export const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden. Insufficient role.' });
    }
    next();
};
