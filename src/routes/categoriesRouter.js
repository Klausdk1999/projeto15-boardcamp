import { getCategories, createCategorie } from '../controllers/categoriesController.js';
import { Router } from 'express';

const router = Router();

router.get('/categories', getCategories);
router.post('/categories', createCategorie);

export default router;
