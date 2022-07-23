import { getRentals, createRental } from '../controllers/rentalsController.js';
import { Router } from 'express';

const router = Router();

router.get('/rentals', getRentals);
router.post('/rentals', createRental);

export default router;