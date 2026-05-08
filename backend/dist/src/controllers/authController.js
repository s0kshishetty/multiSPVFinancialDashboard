"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const prisma = new client_1.PrismaClient();
const publicUser = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    riskThreshold: user.riskThreshold,
    cashBalance: user.cashBalance,
});
const register = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Email and a password of at least 6 characters are required' });
    }
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        // Passwords are never stored directly. bcrypt stores a one-way hash instead.
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: 'INVESTOR',
                riskThreshold: 'MEDIUM',
                cashBalance: 500000000,
            },
        });
        const safeUser = publicUser(user);
        const token = (0, authMiddleware_1.signAuthToken)({ id: user.id, email: user.email, role: user.role });
        res.status(201).json({ token, user: safeUser });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const passwordMatches = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const safeUser = publicUser(user);
        const token = (0, authMiddleware_1.signAuthToken)({ id: user.id, email: user.email, role: user.role });
        res.json({ token, user: safeUser });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: publicUser(user) });
};
exports.getMe = getMe;
