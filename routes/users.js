import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
    getUserTickets
} from '../controllers/users.js'
import {
    validateCreateUser,
    validateUpdateUser,
    validateUserRole
} from '../middleware/validateUser.js';
import { checkValidation } from '../middleware/checkValidation.js';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.get('/', sessionAuth, requireRole('admin'), getAllUsers);
router.get('/:id/tickets', sessionAuth, getUserTickets);
router.get('/:id', sessionAuth, getUserById);
router.post('/', sessionAuth, requireRole('admin'), validateCreateUser, checkValidation, createUser);
router.put('/:id', sessionAuth, validateUpdateUser, checkValidation, updateUser);
router.put('/:id/role', sessionAuth, requireRole('admin'), validateUserRole, checkValidation, updateUserRole);
router.delete('/:id', sessionAuth, requireRole('admin'), deleteUser);

export default router;