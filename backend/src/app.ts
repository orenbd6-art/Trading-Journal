import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { tradeRoutes } from './routes/trade.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/trades',  tradeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));