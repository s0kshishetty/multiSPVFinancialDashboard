import express from 'express';
import { getAllSPVs, getSPVById } from '../controllers/spvController';

const router = express.Router();

router.get('/', getAllSPVs);
router.get('/:id', getSPVById);

export default router;
