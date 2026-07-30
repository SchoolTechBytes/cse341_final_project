import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser
} from '../controllers/users.js'
import {
    validateCreateUser,
    validateUpdateUser,
    validateUserRole
} from '../middleware/validateUser.js';
import { checkValidation } from '../middleware/checkValidation.js';
import { ensureAuth } from '../middleware/ensureAuth.js';

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', validateCreateUser, checkValidation, createUser);
router.put('/users/:id', validateUpdateUser, checkValidation, updateUser);
router.put('/users/:id/role', validateUserRole, checkValidation, updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;