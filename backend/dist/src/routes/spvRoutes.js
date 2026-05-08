"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const spvController_1 = require("../controllers/spvController");
const router = express_1.default.Router();
router.get('/', spvController_1.getAllSPVs);
router.get('/:id', spvController_1.getSPVById);
exports.default = router;
