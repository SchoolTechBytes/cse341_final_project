import bcrypt from 'bcrypt';
import Users from '../models/User.js';
import Tickets from '../models/Ticket.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const { name, email } = req.query;
        const filter = {};
        if (name) filter.name = name;
        if (email) filter.email = email;

        const users = await Users.find(filter).select('-passwordHash');
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const isSelf = req.user._id.toString() === req.params.id;
        const isPrivileged = ['support', 'manager', 'admin'].includes(req.user.role);
        if (!isSelf && !isPrivileged) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const user = await Users.findById(req.params.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(err);
    }
};

export const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await Users.create({ name, email, passwordHash, authProvider: 'local', role: role || 'customer' });

        const { passwordHash: _omit, ...userResponse } = user.toObject();
        res.status(201).json(userResponse);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const isSelf = req.user._id.toString() === req.params.id;
        const isPrivileged = ['admin', 'manager'].includes(req.user.role);
        if (!isSelf && !isPrivileged) {
            return res.status(403).json({ error: 'Forbidden. You can only update your own profile.' });
        }

        const { name, email } = req.body;
        const user = await Users.findByIdAndUpdate(
            req.params.id,
            { name, email },
            { new: true, runValidators: true }
        ).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(err);
    }
};

export const updateUserRole = async (req, res, next) => {
    try {
        const user = await Users.findByIdAndUpdate(
            req.params.id,
            { role: req.body.role },
            { new: true, runValidators: true }
        ).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(err);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const user = await Users.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(err);
    }
};

export const getUserTickets = async (req, res, next) => {
    try {
        const isSelf = req.user._id.toString() === req.params.id;
        const isPrivileged = ['support', 'manager', 'admin'].includes(req.user.role);
        if (!isSelf && !isPrivileged) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const tickets = await Tickets.find({
            $or: [{ createdBy: req.params.id }, { assignedTo: req.params.id }]
        });
        res.status(200).json(tickets);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(err);
    }
};
