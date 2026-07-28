import express from 'express';
import ticketRoutes from './tickets.js';

const router = express.Router();

router.use('/ticktes', ticketRoutes);

export default router;