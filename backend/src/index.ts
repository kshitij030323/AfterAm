import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { bookingsRouter } from './routes/bookings.js';
import { clubsRouter } from './routes/clubs.js';
import { scannerRouter } from './routes/scanner.js';
import uploadRouter, { checkR2Connection } from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/upload', uploadRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, async () => {
    console.log(`🚀 AfterHour API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);

    // Check R2 connection at startup
    await checkR2Connection();
});
