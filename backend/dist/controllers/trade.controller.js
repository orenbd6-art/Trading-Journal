import { TradeService } from '../services/trade.service';
export const TradeController = {
    getAll: async (req, res, next) => { try {
        res.json(await TradeService.getAll(req.query));
    }
    catch (e) {
        next(e);
    } },
    getById: async (req, res, next) => { try {
        res.json(await TradeService.getById(req.params.id));
    }
    catch (e) {
        next(e);
    } },
    create: async (req, res, next) => { try {
        res.status(201).json(await TradeService.create(req.body));
    }
    catch (e) {
        next(e);
    } },
    update: async (req, res, next) => { try {
        res.json(await TradeService.update(req.params.id, req.body));
    }
    catch (e) {
        next(e);
    } },
    delete: async (req, res, next) => { try {
        await TradeService.delete(req.params.id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    } },
    getStats: async (req, res, next) => {
        try {
            // שליחת הפרמטר 'account' מתוך ה-query string לתוך ה-service
            const result = await TradeService.getStats(req.query.account);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    },
};
