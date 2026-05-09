import { Request, Response, NextFunction } from 'express';
import { TradeService } from '../services/trade.service';

export const TradeController = {
  getAll:   async (req: Request, res: Response, next: NextFunction) => { try { res.json(await TradeService.getAll(req.query)); } catch (e) { next(e); } },
  getById:  async (req: Request, res: Response, next: NextFunction) => { try { res.json(await TradeService.getById(req.params.id as string)); } catch (e) { next(e); } },
  create:   async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await TradeService.create(req.body)); } catch (e) { next(e); } },
  update:   async (req: Request, res: Response, next: NextFunction) => { try { res.json(await TradeService.update(req.params.id as string, req.body)); } catch (e) { next(e); } },
  delete:   async (req: Request, res: Response, next: NextFunction) => { try { await TradeService.delete(req.params.id as string); res.status(204).send(); } catch (e) { next(e); } },
  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
        // שליחת הפרמטר 'account' מתוך ה-query string לתוך ה-service
        const result = await TradeService.getStats(req.query.account as string);
        res.json(result);
    } catch (err) {
        next(err);
    }
},
};