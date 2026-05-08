"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const portfolioController_1 = require("../controllers/portfolioController");
const router = express_1.default.Router();
router.get('/', portfolioController_1.getPortfolioSummary);
router.post('/watchlist', portfolioController_1.addToWatchlist);
exports.default = router;
