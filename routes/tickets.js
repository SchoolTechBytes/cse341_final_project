import express from 'express';

const router = express.Router();

router.post('/tickets');
router.get('/tickets');
router.get('/tickets/:id');
router.put('tickets/:id/status');
router.put('/tickets/:id/assign');
router.put('tickets/:id/priorty');

export default router;