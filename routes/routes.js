import express from 'express';
import ticketRoutes from './tickets.js';
import userRoutes from './users.js';

const router = express.Router();

router.use('/ticktes', ticketRoutes);
router.use('/users', userRoutes);

export default router;