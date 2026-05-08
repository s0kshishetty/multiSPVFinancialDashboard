import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/authRoutes';
import spvRoutes from './routes/spvRoutes';
import alertRoutes from './routes/alertRoutes';
import transactionRoutes from './routes/transactionRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import { initCronJobs } from './cron/alertMonitor';
import { AuthUser, authenticateToken } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/spvs', authenticateToken, spvRoutes);
app.use('/api/alerts', authenticateToken, alertRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/portfolio', authenticateToken, portfolioRoutes);

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
    socket.data.user = jwt.verify(token, process.env.JWT_SECRET) as AuthUser;
    next();
  } catch {
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
  initCronJobs();
});
