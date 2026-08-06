import { body } from 'express-validator';

const STATUS_VALUES = ['new', 'in_progress', 'rejected', 'closed'];
const PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'];

export const validateCreateTicket = [
    body('title').isString().trim().notEmpty().withMessage('title is required'),
    body('description').isString().trim().notEmpty().withMessage('description is required')
];

export const validateTicketStatus = [
    body('status').isIn(STATUS_VALUES).withMessage(`status must be one of ${STATUS_VALUES.join(', ')}`)
];

export const validateTicketAssign = [
    body('assignedTo').isMongoId().withMessage('assignedTo must be a valid user id')
];

export const validateTicketPriority = [
    body('priority').isIn(PRIORITY_VALUES).withMessage(`priority must be one of ${PRIORITY_VALUES.join(', ')}`)
];
