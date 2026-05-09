import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller.js';

const router = Router();
router.get('/stats',  TradeController.getStats);
router.get('/',       TradeController.getAll);
router.get('/:id',    TradeController.getById);
router.post('/',      TradeController.create);
router.patch('/:id', TradeController.update);
router.delete('/:id', TradeController.delete);
export { router as tradeRoutes };