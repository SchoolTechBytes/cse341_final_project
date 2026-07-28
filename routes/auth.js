import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

router.post('/register');
router.post('/login');
router.get('/github');
router.get('/github/callback');
router.post('/logout');
router.get('/me');

export default router;