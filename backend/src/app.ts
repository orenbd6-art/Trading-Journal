import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { tradeRoutes } from './routes/trade.routes';
import { uploadRoutes } from './routes/upload.routes';
import { errorMiddleware } from './middleware/error.middleware';

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