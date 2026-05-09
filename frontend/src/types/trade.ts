export type EntryModel = 'IFVG' | 'MODEL_2022' | 'CISD' | 'MSS' | 'OTE' | 'UNICORN';

export interface Trade {
  id: string;
  createdAt: string;
  date: string;
  ticker: string;
  direction: 'LONG' | 'SHORT';
  session: string;
account: 'FUNDED' | 'DEMO' | 'BACKTEST';
  // ✅ חדש
  entryTime?: string;
  exitTime?: string;
  entryModel?: EntryModel;

  entry: number;
  stop: number;
  target: number;
  exit?: number;
  contracts: number;
  pnl?: number;
  rr?: number;
  setupGrade: string;
  notes?: string;
  emotionalState: string;
  followedPlan: boolean;
  screenshotUrls?: string | string[];
}