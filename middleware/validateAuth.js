import { body } from 'express-validator';

export const validateRegister = [
    body('name').isString().trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
    body('password').isString().isLength({ min: 8 }).withMessage('password must be at least 8 characters')
];

export const validateLogin = [
    body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('password is required')
];
