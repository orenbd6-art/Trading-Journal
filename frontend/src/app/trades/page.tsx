'use client';
import { useEffect, useState } from 'react';
import { tradesApi } from '@/services/api';
import { Trade } from '@/types/trade';
import { format } from 'date-fns';
import Link from 'next/link';
import { TradeDetailModal } from '../../components/TradeDetail/TradeDetailModal';
import { useAccount } from '@/context/AccountContext';
import { TradeForm } from '../../components/TradeForm/TradeForm';

function getUrls(trade: Trade): string[] {
  try {
    if (!trade.screenshotUrls) return [];
    if (Array.isArray(trade.screenshotUrls)) return trade.screenshotUrls;
    return JSON.parse(trade.screenshotUrls as string);
  } catch { return []; }
}

export default function TradeLogPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [filters, setFilters] = useState({ ticker: '', session: '', page: 1 });
const { account } = useAccount();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const fetchTrades = () => {
  setLoading(true);
  const apiFilters = {
    ...filters,
    ...(account !== 'ALL' ? { account } : {})
  };
  tradesApi.getAll(apiFilters).then((data: any) => {
      setTrades(data.trades);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrades(); }, [filters, account]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('למחוק את הטרייד הזה?')) return;
    await tradesApi.delete(id);
    fetchTrades();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trade Log</h1>
          <p className="text-gray-500 text-sm mt-1">{total} trades</p>
        </div>
        <Link href="/trades/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
          + Add Trade
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          placeholder="חיפוש לפי Ticker..."
          value={filters.ticker}
          onChange={e => setFilters(f => ({ ...f, ticker: e.target.value, page: 1 }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 w-48"
        />
        <select
          value={filters.session}
          onChange={e => setFilters(f => ({ ...f, session: e.target.value, page: 1 }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">כל ה-Sessions</option>
          <option value="NEW_YORK_PM">New York PM</option>
          <option value="NEW_YORK_AM">New York AM</option>
          <option value="LONDON">London</option>
          <option value="ASIA">Asia</option>
          <option value="PRE_MARKET">Pre-Market</option>
          <option value="OVERLAP">Overlap</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">טוען...</div>
      ) : trades.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">📋</p>
          <p>אין טריידים עדיין.</p>
          <Link href="/trades/new" className="text-emerald-400 hover:underline mt-2 block">
            הוסף את הראשון →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">תמונה</th>
                <th className="px-4 py-3 text-left font-medium">תאריך</th>
                <th className="px-4 py-3 text-left font-medium">Ticker</th>
                {account === 'ALL' && <th className="px-4 py-3 text-left font-medium">Account</th>}

                <th className="px-4 py-3 text-left font-medium">Dir</th>
                <th className="px-4 py-3 text-left font-medium">Session</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
<th className="px-4 py-3 text-left font-medium">Model</th>
                <th className="px-4 py-3 text-left font-medium">Entry</th>
                <th className="px-4 py-3 text-left font-medium">Exit</th>
                <th className="px-4 py-3 text-left font-medium">P&L</th>
                <th className="px-4 py-3 text-left font-medium">R:R</th>
                <th className="px-4 py-3 text-left font-medium">Grade</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {trades.map(trade => {
                const urls = getUrls(trade);
                const thumb = urls[0];
                return (
                  <tr
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className="hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      {thumb ? (
                        <img
                          src={`${apiBase}${thumb}`}
                          alt="screenshot"
                          className="w-14 h-10 object-cover rounded-md border border-gray-700"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-600 text-xs">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {format(new Date(trade.date), 'dd/MM/yy')}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{trade.ticker}</td>
                    {account === 'ALL' && (
  <td className="px-4 py-3">
    <span className={`px-2 py-1 rounded text-xs font-semibold ${
      trade.account === 'FUNDED' 
        ? 'bg-emerald-500/20 text-emerald-400' 
        : trade.account === 'DEMO' 
        ? 'bg-blue-500/20 text-blue-400' 
        : 'bg-purple-500/20 text-purple-400'
    }`}>
      {trade.account}
    </span>
  </td>
)}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.direction === 'LONG'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.direction === 'LONG' ? '↑ Long' : '↓ Short'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{trade.session.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
  {trade.entryTime ?? '—'}
  {trade.entryTime && trade.exitTime && <span className="text-gray-600"> → </span>}
  {trade.exitTime ?? ''}
</td>
<td className="px-4 py-3">
  {trade.entryModel ? (
    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-semibold">
      {trade.entryModel === 'MODEL_2022' ? '2022' :
       trade.entryModel === 'UNICORN' ? '🦄' :
       trade.entryModel}
    </span>
  ) : (
    <span className="text-gray-600 text-xs">—</span>
  )}
</td>
                    <td className="px-4 py-3 text-gray-300">{trade.entry}</td>
                    <td className="px-4 py-3 text-gray-300">{trade.exit ?? '—'}</td>
                    <td className={`px-4 py-3 font-semibold ${
                      trade.pnl == null ? 'text-gray-500'
                      : trade.pnl > 0 ? 'text-emerald-400'
                      : 'text-red-400'
                    }`}>
                      {trade.pnl != null ? `$${trade.pnl.toFixed(0)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{trade.rr?.toFixed(2) ?? '—'}R</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                        {trade.setupGrade.replace('_PLUS', '+')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-lg">{trade.followedPlan ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 flex gap-2" onClick={e => e.stopPropagation()}>
                      
  <button
    onClick={(e) => { e.stopPropagation(); setEditingTrade(trade); }}
    className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
  >
    ✏️ ערוך
  </button>
  <button
    onClick={(e) => handleDelete(trade.id, e)}
    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
  >
    מחק
  </button>
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}
            {editingTrade && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-6">
        {/* תיקון הכותרת: כאן editingTrade כן קיים, אז זה יעבוד */}
        <h2 className="text-xl font-bold text-white">✏️ ערוך טרייד — {editingTrade.ticker}</h2>
        <button
          onClick={() => setEditingTrade(null)}
          className="text-gray-400 hover:text-white text-2xl leading-none"
        >×</button>
      </div>
      
      <TradeForm
  editId={editingTrade.id}
  defaultValues={{
    ...editingTrade,
    date: editingTrade.date ? new Date(editingTrade.date).toISOString().split('T')[0] : '',
    // התיקון: מוודא שזה תמיד מערך, גם אם ב-DB הוא null, ומשתמש ב-as any
    screenshotUrls: (Array.isArray(editingTrade.screenshotUrls) 
      ? editingTrade.screenshotUrls 
      : []) as any
  } as any} 
  onSuccess={() => {
    setEditingTrade(null);
    fetchTrades();
  }}
/>
    </div>
  </div>
)}
    </div>
  );
}