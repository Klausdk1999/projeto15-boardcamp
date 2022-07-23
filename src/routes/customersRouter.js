import { getCustomers, createCustomer } from '../controllers/customerController.js';
import { Router } from 'express';

const router = Router();

router.get('/customers', getCustomers);
router.post('/customers', createCustomer);

export default router;