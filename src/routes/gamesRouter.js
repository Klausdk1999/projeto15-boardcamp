import { getGames, createGame } from '../controllers/gamesController.js';
import { Router } from 'express';

const router = Router();

router.get('/games', getGames);
router.post('/games', createGame);

export default router;