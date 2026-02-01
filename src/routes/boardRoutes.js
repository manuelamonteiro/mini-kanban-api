import { Router } from 'express';
import * as boardController from '../controllers/boardController.js';

const router = Router();

router.post('/', boardController.createBoard);
router.get('/', boardController.listBoards);
router.get('/:id', boardController.getBoard);
router.post('/:id/columns', boardController.createColumn);
router.delete('/:id', boardController.deleteBoard);

export default router;
