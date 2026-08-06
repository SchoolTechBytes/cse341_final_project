import express from 'express';
import passport from '../config/passport.js';
import { register, login, logout, me, githubCallback } from '../controllers/auth.js';
import { validateRegister, validateLogin } from '../middleware/validateAuth.js';
import { checkValidation } from '../middleware/checkValidation.js';
import { sessionAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.post('/register', validateRegister, checkValidation, register);
router.post('/login', validateLogin, checkValidation, login);
router.post('/logout', sessionAuth, logout);
router.get('/me', sessionAuth, me);

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get(
    '/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/auth/github' }),
    githubCallback
);

export default router;
