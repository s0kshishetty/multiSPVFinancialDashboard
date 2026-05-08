import express from 'express';
import { getPortfolioSummary, addToWatchlist } from '../controllers/portfolioController';

const router = express.Router();

router.get('/', getPortfolioSummary);
router.post('/watchlist', addToWatchlist);

export default router;
