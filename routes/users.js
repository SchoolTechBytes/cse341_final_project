import express from 'express';

const router = express.Router();

router.get('/users');
router.get('/users/:id');
router.post('/users');
router.put('users/:id');
router.put('/users/:id/role');
router.delete('users/:id');

export default router;