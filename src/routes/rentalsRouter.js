import { getRentals, rent, deleteRental, finish } from '../controllers/rentalsController.js';
import { Router } from 'express';

const router = Router();

router.get("/rentals", getRentals); 
router.post("/rentals", rent); 
router.post("/rentals/:id/return", finish);
router.delete("/rentals/:id", deleteRental);
export default router;