import express from 'express';
import { executeTransaction, executeBasketTransaction } from '../controllers/transactionController';

const router = express.Router();

router.post('/', executeTransaction);
router.post('/basket', executeBasketTransaction);

export default router;
