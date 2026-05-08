import express from 'express';
import { getActiveAlerts } from '../controllers/alertController';

const router = express.Router();

router.get('/', getActiveAlerts);

export default router;
