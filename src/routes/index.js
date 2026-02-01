import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import authRoutes from './authRoutes.js';
import boardRoutes from './boardRoutes.js';
import cardRoutes from './cardRoutes.js';
import { errorTypes } from '../utils/errors.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/boards', authMiddleware, boardRoutes);
router.use('/', authMiddleware, cardRoutes);

router.use((req, res, next) => next(errorTypes.notFound()));

export default router;
