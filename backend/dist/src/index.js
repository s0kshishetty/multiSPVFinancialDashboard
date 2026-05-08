"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const spvRoutes_1 = __importDefault(require("./routes/spvRoutes"));
const alertRoutes_1 = __importDefault(require("./routes/alertRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const portfolioRoutes_1 = __importDefault(require("./routes/portfolioRoutes"));
const alertMonitor_1 = require("./cron/alertMonitor");
const authMiddleware_1 = require("./middleware/authMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const server = http_1.default.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const io = new socket_io_1.Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST']
    }
});
app.use((0, cors_1.default)({ origin: corsOrigin }));
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api/spvs', authMiddleware_1.authenticateToken, spvRoutes_1.default);
app.use('/api/alerts', authMiddleware_1.authenticateToken, alertRoutes_1.default);
app.use('/api/transactions', authMiddleware_1.authenticateToken, transactionRoutes_1.default);
app.use('/api/portfolio', authMiddleware_1.authenticateToken, portfolioRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});
// WebSocket clients also send the JWT, so real-time alerts remain user-aware.
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || !process.env.JWT_SECRET) {
        return next(new Error('Authentication required'));
    }
    try {
        socket.data.user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch {
        next(new Error('Invalid token'));
    }
});
// WebSocket connection handling
io.on('connection', (socket) => {
    console.log(`Client connected for real-time alerts: user ${socket.data.user.id}`);
    // Simulate real-time risk alerts every 30 seconds
    const alertInterval = setInterval(() => {
        const severities = ['LOW', 'MEDIUM', 'CRITICAL'];
        const mockAlert = {
            id: Math.random(),
            userId: socket.data.user.id,
            spvId: Math.floor(Math.random() * 100) + 1,
            condition: 'Real-time Risk Update',
            message: 'A real-time market event affected SPV valuation.',
            severity: severities[Math.floor(Math.random() * severities.length)],
            createdAt: new Date().toISOString()
        };
        socket.emit('new_alert', mockAlert);
    }, 30000);
    socket.on('disconnect', () => {
        clearInterval(alertInterval);
        console.log('Client disconnected');
    });
});
server.listen(port, () => {
    console.log(`Backend server with WebSockets running on port ${port}`);
    (0, alertMonitor_1.initCronJobs)();
});
