"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is missing. Add it to backend/.env before starting the server.');
    }
    return secret;
};
// This middleware protects API routes by requiring a valid JWT in the Authorization header.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
        return res.status(401).json({ error: 'Authentication token is required' });
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, getJwtSecret());
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const signAuthToken = (user) => {
    return jsonwebtoken_1.default.sign(user, getJwtSecret(), { expiresIn: '1d' });
};
exports.signAuthToken = signAuthToken;
