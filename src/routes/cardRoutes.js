import { Router } from 'express';
import * as cardController from '../controllers/cardController.js';

const router = Router();

router.post('/columns/:columnId/cards', cardController.createCard);
router.put('/cards/:id', cardController.updateCard);
router.delete('/cards/:id', cardController.deleteCard);
router.patch('/cards/:id/move', cardController.moveCard);

export default router;
