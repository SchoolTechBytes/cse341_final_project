import { body } from 'express-validator';

const ROLE_VALUES = ['customer', 'support', 'manager', 'admin'];

export const validateCreateUser = [
    body('name').isString().trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
    body('password').isString().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
    body('role').optional().isIn(ROLE_VALUES).withMessage(`role must be one of ${ROLE_VALUES.join(', ')}`)
];

export const validateUpdateUser = [
    body('name').optional().isString().trim().notEmpty().withMessage('name cannot be empty'),
    body('email').optional().isEmail().withMessage('a valid email is required').normalizeEmail()
];

export const validateUserRole = [
    body('role').isIn(ROLE_VALUES).withMessage(`role must be one of ${ROLE_VALUES.join(', ')}`)
];
