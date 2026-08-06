import { body } from 'express-validator';

export const validateCreateComment = [
    body('body').isString().trim().notEmpty().withMessage('body is required'),
    body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
];
