import express from 'express';
import {
    getCommentsForTicket,
    createComment
} from '../controllers/comments.js';
import { validateCreateComment } from '../middleware/validateComment.js';
import { checkValidation } from '../middleware/checkValidation.js';
import { sessionAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.get('/:id/comments', sessionAuth, getCommentsForTicket);
router.post('/:id/comments', sessionAuth, validateCreateComment, checkValidation, createComment);

export default router;
