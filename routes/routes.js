import express from 'express';
import ticketRoutes from './tickets.js';
import userRoutes from './users.js';
import authRoutes from './auth.js';
import commentRoutes from './comments.js';
import ticketHistoryRoutes from './ticketHistory.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/tickets', commentRoutes);
router.use('/tickets', ticketHistoryRoutes);
router.use('/users', userRoutes);

export default router;