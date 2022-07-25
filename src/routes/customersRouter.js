import { updateCustomer, getCustomer, getCustomers, createCustomer } from '../controllers/customerController.js';
import { Router } from 'express';

const router = Router();

router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomer);
router.post("/customers", createCustomer);
router.put("/customers", updateCustomer);

export default router;