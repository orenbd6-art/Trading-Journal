import { PrismaClient } from '@prisma/client';
import { calculateRR, calculatePnL } from '../utils/calculations';

const prisma = new PrismaClient();

export const TradeService = {
  async getAll(query: any) {
  // ×©×•×¨×” 8 ×ª×©×ž×¨
  const { ticker, session, startDate, endDate, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 20, account } = query;
  const where: any = {};

  if (ticker) where.ticker = { contains: ticker };
  if (session) where.session = session;
  if (account && account !== 'ALL') {
    where.account = account;
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const [trades, total] = await Promise.all([
    prisma.trade.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (pageNum - 1) * limitNum, take: limitNum }),
    prisma.trade.count({ where }),
  ]);
  return { trades, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
},

  async getById(id: string) {
    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) throw { status: 404, message: 'Trade not found' };
    return trade;
  },

  async create(data: any) {
  const rr = data.rr ?? calculateRR(data.entry, data.stop, data.target);
  const pnl = data.exit
    ? (data.pnl ?? calculatePnL(data.entry, data.exit, data.contracts, data.direction))
    : null;

  // ×ª×ž×™×“ ×©×ž×•×¨ ×›-JSON string
  const screenshotUrls = typeof data.screenshotUrls === 'string'
    ? data.screenshotUrls
    : JSON.stringify(data.screenshotUrls ?? []);

  return prisma.trade.create({
    data: {
      ...data,
      rr,
      pnl,
      screenshotUrls,
      date: new Date(data.date),
    },
  });
},

  async update(id: string, data: any) {
    if (data.entry && data.stop && data.target) data.rr = data.rr ?? calculateRR(data.entry, data.stop, data.target);
    if (data.entry && data.exit && data.contracts && data.direction) data.pnl = data.pnl ?? calculatePnL(data.entry, data.exit, data.contracts, data.direction);
    if (data.date) data.date = new Date(data.date);
    if (data.screenshotUrls) data.screenshotUrls = JSON.stringify(data.screenshotUrls);

    return prisma.trade.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.trade.delete({ where: { id } });
  },

  async getStats(account?: string) {
    const where = account && account !== 'ALL' 
      ? { account: account as any } 
      : {};

    const trades = await prisma.trade.findMany({ where });
  const closed = trades.filter(t => t.pnl !== null && t.exit !== null);
  const wins   = closed.filter(t => (t.pnl ?? 0) > 0);
  const losses = closed.filter(t => (t.pnl ?? 0) < 0);

  const totalPnL    = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgWin      = wins.length   ? wins.reduce((s,t)=>s+(t.pnl??0),0)   / wins.length   : 0;
  const avgLoss     = losses.length ? losses.reduce((s,t)=>s+(t.pnl??0),0) / losses.length : 0;
  const grossProfit = wins.reduce((s,t)=>s+(t.pnl??0),0);
  const grossLoss   = Math.abs(losses.reduce((s,t)=>s+(t.pnl??0),0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy  = closed.length
    ? (wins.length/closed.length) * avgWin + (losses.length/closed.length) * avgLoss
    : 0;

  // Holding time
  const holdingTimes = closed
    .filter(t => t.entryTime && t.exitTime)
    .map(t => {
      const [eh, em] = (t.entryTime as string).split(':').map(Number);
      const [xh, xm] = (t.exitTime  as string).split(':').map(Number);
      return (xh * 60 + xm) - (eh * 60 + em);
    })
    .filter(m => m > 0);
  const avgHoldingMin = holdingTimes.length
    ? holdingTimes.reduce((s,m)=>s+m,0) / holdingTimes.length : 0;

  // Followed plan
  const followedPlanRate = trades.length
    ? (trades.filter(t=>t.followedPlan).length / trades.length) * 100 : 0;

  // By setup grade
  const byGrade: Record<string, {wins:number, total:number, pnl:number}> = {};
  closed.forEach(t => {
    const g = t.setupGrade;
    if (!byGrade[g]) byGrade[g] = { wins:0, total:0, pnl:0 };
    byGrade[g].total++;
    byGrade[g].pnl += (t.pnl ?? 0);
    if ((t.pnl??0) > 0) byGrade[g].wins++;
  });

  // By emotional state
  const byEmotion: Record<string, {wins:number, total:number, pnl:number}> = {};
  closed.forEach(t => {
    const e = t.emotionalState;
    if (!byEmotion[e]) byEmotion[e] = { wins:0, total:0, pnl:0 };
    byEmotion[e].total++;
    byEmotion[e].pnl += (t.pnl ?? 0);
    if ((t.pnl??0) > 0) byEmotion[e].wins++;
  });

  // By session
  const bySession: Record<string, {wins:number, total:number, pnl:number}> = {};
  closed.forEach(t => {
    const s = t.session;
    if (!bySession[s]) bySession[s] = { wins:0, total:0, pnl:0 };
    bySession[s].total++;
    bySession[s].pnl += (t.pnl ?? 0);
    if ((t.pnl??0) > 0) bySession[s].wins++;
  });

  // By entry model
  const byModel: Record<string, {wins:number, total:number, pnl:number}> = {};
  closed.forEach(t => {
    const m = t.entryModel || 'Unknown';
    if (!byModel[m]) byModel[m] = { wins:0, total:0, pnl:0 };
    byModel[m].total++;
    byModel[m].pnl += (t.pnl ?? 0);
    if ((t.pnl??0) > 0) byModel[m].wins++;
  });

  // Long vs Short
  const byDirection: Record<string, {wins:number, total:number, pnl:number}> = {};
  closed.forEach(t => {
    const d = t.direction;
    if (!byDirection[d]) byDirection[d] = { wins:0, total:0, pnl:0 };
    byDirection[d].total++;
    byDirection[d].pnl += (t.pnl ?? 0);
    if ((t.pnl??0) > 0) byDirection[d].wins++;
  });
// Daily P&L for heatmap + equity curve
const dailyPnL: Record<string, number> = {};
closed.forEach(t => {
  const day = new Date(t.date).toISOString().split('T')[0];
  dailyPnL[day] = (dailyPnL[day] ?? 0) + (t.pnl ?? 0);
});

// Equity curve + drawdown
const sortedDays = Object.keys(dailyPnL).sort();
let equity = 0;
let peak = 0;
const equityCurve: { date: string; equity: number; drawdown: number }[] = [];
sortedDays.forEach(day => {
  equity += dailyPnL[day];
  peak = Math.max(peak, equity);
  const drawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;
  equityCurve.push({ date: day, equity: parseFloat(equity.toFixed(2)), drawdown: parseFloat(drawdown.toFixed(2)) });
});

// Day Ã— Session heatmap (win rate)
const daySessionMap: Record<string, Record<string, { wins: number; total: number }>> = {};
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
closed.forEach(t => {
  const day = DAYS[new Date(t.date).getDay()];
  const sess = t.session;
  if (!daySessionMap[day]) daySessionMap[day] = {};
  if (!daySessionMap[day][sess]) daySessionMap[day][sess] = { wins: 0, total: 0 };
  daySessionMap[day][sess].total++;
  if ((t.pnl ?? 0) > 0) daySessionMap[day][sess].wins++;
});

// Entry Model Ã— Setup Grade heatmap
const modelGradeMap: Record<string, Record<string, { wins: number; total: number; pnl: number }>> = {};
closed.forEach(t => {
  const model = t.entryModel || 'Unknown';
  const grade = t.setupGrade;
  if (!modelGradeMap[model]) modelGradeMap[model] = {};
  if (!modelGradeMap[model][grade]) modelGradeMap[model][grade] = { wins: 0, total: 0, pnl: 0 };
  modelGradeMap[model][grade].total++;
  modelGradeMap[model][grade].pnl += (t.pnl ?? 0);
  if ((t.pnl ?? 0) > 0) modelGradeMap[model][grade].wins++;
});

// Emotion Ã— Followed Plan insight
const emotionPlanMap: Record<string, { followed: number; notFollowed: number; totalPnl: number; trades: number }> = {};
trades.forEach(t => {
  const e = t.emotionalState;
  if (!emotionPlanMap[e]) emotionPlanMap[e] = { followed: 0, notFollowed: 0, totalPnl: 0, trades: 0 };
  emotionPlanMap[e].trades++;
  emotionPlanMap[e].totalPnl += (t.pnl ?? 0);
  if (t.followedPlan) emotionPlanMap[e].followed++;
  else emotionPlanMap[e].notFollowed++;
});
  return {
    totalTrades:    trades.length,
    closedTrades:   closed.length,
    winRate:        closed.length ? parseFloat(((wins.length/closed.length)*100).toFixed(1)) : 0,
    totalPnL:       parseFloat(totalPnL.toFixed(2)),
    avgWin:         parseFloat(avgWin.toFixed(2)),
    avgLoss:        parseFloat(avgLoss.toFixed(2)),
    profitFactor: isFinite(profitFactor) 
  ? parseFloat(profitFactor.toFixed(2)) 
  : null,
    expectancy:     parseFloat(expectancy.toFixed(2)),
    avgHoldingMin:  parseFloat(avgHoldingMin.toFixed(1)),
    followedPlanRate: parseFloat(followedPlanRate.toFixed(1)),
    // âœ… × ×›×•×Ÿ
bestTrade:  closed.reduce((b,t)=>(t.pnl??-Infinity)>(b?.pnl??-Infinity)?t:b, null as any),
worstTrade: closed.reduce((w,t)=>(t.pnl??Infinity)<(w?.pnl??Infinity)?t:w, null as any),
    byGrade,
    byEmotion,
    bySession,
    byModel,
    byDirection,
    dailyPnL,
    equityCurve,
    daySessionMap,
    modelGradeMap,
    emotionPlanMap
  };
  
},
};