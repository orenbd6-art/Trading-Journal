'use client';
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

// ── Equity Curve ──────────────────────────────────────────
export function EquityCurveChart({ data }: { data: { date: string; equity: number }[] }) {
  if (!data?.length) return <EmptyChart label="Equity Curve" />;
  const isPositive = data[data.length - 1]?.equity >= 0;

  return (
    <ChartCard title="📈 Equity Curve">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Equity']}
          />
          <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
          <Area
            type="monotone" dataKey="equity"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            fill="url(#eqGrad)" strokeWidth={2} dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Drawdown Chart ─────────────────────────────────────────
export function DrawdownChart({ data }: { data: { date: string; drawdown: number }[] }) {
  if (!data?.length) return <EmptyChart label="Drawdown" />;

  return (
    <ChartCard title="📉 Drawdown">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            formatter={(v: unknown) => [`${(v as number).toFixed(2)}%`, 'Drawdown']}
          />
          <Area
            type="monotone" dataKey="drawdown"
            stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={2} dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Calendar Heatmap ───────────────────────────────────────
export function CalendarHeatmapChart({ dailyPnL }: { dailyPnL: Record<string, number> }) {
  const values = Object.entries(dailyPnL).map(([date, pnl]) => ({ date, count: pnl }));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  return (
    <ChartCard title="📅 Trading Activity (Last 12 Months)">
      <style>{`
        .react-calendar-heatmap .color-win-4 { fill: #059669; }
        .react-calendar-heatmap .color-win-3 { fill: #10b981; }
        .react-calendar-heatmap .color-win-2 { fill: #34d399; }
        .react-calendar-heatmap .color-win-1 { fill: #6ee7b7; }
        .react-calendar-heatmap .color-loss-1 { fill: #fca5a5; }
        .react-calendar-heatmap .color-loss-2 { fill: #f87171; }
        .react-calendar-heatmap .color-loss-3 { fill: #ef4444; }
        .react-calendar-heatmap .color-loss-4 { fill: #b91c1c; }
        .react-calendar-heatmap .color-empty { fill: #1f2937; }
        .react-calendar-heatmap text { fill: #6b7280; font-size: 9px; }
      `}</style>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={(value) => {
          if (!value || value.count === 0) return 'color-empty';
          const pnl = value.count as number;
          if (pnl > 500)  return 'color-win-4';
          if (pnl > 200)  return 'color-win-3';
          if (pnl > 50)   return 'color-win-2';
          if (pnl > 0)    return 'color-win-1';
          if (pnl > -50)  return 'color-loss-1';
          if (pnl > -200) return 'color-loss-2';
          if (pnl > -500) return 'color-loss-3';
          return 'color-loss-4';
        }}
        titleForValue={(value) =>
            value?.date
              ? `${value.date}: $${Number(value.count).toFixed(0)}`
              : 'No trades'
          }
        showWeekdayLabels
      />
      <div className="flex items-center gap-3 mt-3 justify-end text-xs text-gray-500">
        <span>Loss</span>
        {['#b91c1c','#ef4444','#f87171','#fca5a5'].map(c=>(
          <span key={c} className="w-3 h-3 rounded-sm inline-block" style={{background:c}}/>
        ))}
        <span className="w-3 h-3 rounded-sm inline-block bg-gray-800"/>
        {['#6ee7b7','#34d399','#10b981','#059669'].map(c=>(
          <span key={c} className="w-3 h-3 rounded-sm inline-block" style={{background:c}}/>
        ))}
        <span>Win</span>
      </div>
    </ChartCard>
  );
}

// ── Day × Session Heatmap ──────────────────────────────────
const SESSIONS = ['LONDON','NEW_YORK','ASIA','PRE_MARKET','OVERLAP'];
const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function DaySessionHeatmap({ data }: { data: Record<string, Record<string, { wins: number; total: number }>> }) {
  return (
    <ChartCard title="🗓️ Win Rate: Day × Session">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-500 pb-2 pr-3">Day</th>
              {SESSIONS.map(s => (
                <th key={s} className="text-center text-gray-500 pb-2 px-1">
                  {s.replace('_',' ').replace('NEW YORK','NY').replace('PRE MARKET','Pre')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="text-gray-400 pr-3 py-1 font-medium">{day}</td>
                {SESSIONS.map(sess => {
                  const cell = data?.[day]?.[sess];
                  if (!cell || cell.total === 0) {
                    return <td key={sess} className="px-1 py-1">
                      <div className="w-full h-8 bg-gray-800/40 rounded" />
                    </td>;
                  }
                  const rate = (cell.wins / cell.total) * 100;
                  const bg = rate >= 60 ? '#059669' : rate >= 50 ? '#10b981' : rate >= 40 ? '#d97706' : '#ef4444';
                  return (
                    <td key={sess} className="px-1 py-1">
                      <div
                        className="w-full h-8 rounded flex flex-col items-center justify-center text-white font-semibold"
                        style={{ background: bg, opacity: 0.7 + (cell.total / 20) * 0.3 }}
                        title={`${day} ${sess}: ${rate.toFixed(0)}% (${cell.wins}/${cell.total})`}
                      >
                        <span>{rate.toFixed(0)}%</span>
                        <span className="text-[9px] opacity-70">{cell.total}t</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

// ── Entry Model × Setup Grade ──────────────────────────────
const GRADES = ['A_PLUS','A','B','C','D'];

export function ModelGradeMap({ data }: { data: Record<string, Record<string, { wins: number; total: number; pnl: number }>> }) {
  const models = Object.keys(data);
  if (!models.length) return null;

  return (
    <ChartCard title="📐 Setup Map: Entry Model × Grade">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-500 pb-2 pr-3">Model</th>
              {GRADES.map(g => (
                <th key={g} className="text-center text-gray-500 pb-2 px-1">
                  {g.replace('_PLUS','+')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model}>
                <td className="text-gray-400 pr-3 py-1 font-medium text-[11px]">
                  {model.replace('_',' ')}
                </td>
                {GRADES.map(grade => {
                  const cell = data[model]?.[grade];
                  if (!cell || cell.total === 0) {
                    return <td key={grade} className="px-1 py-1">
                      <div className="w-full h-10 bg-gray-800/40 rounded" />
                    </td>;
                  }
                  const rate = (cell.wins / cell.total) * 100;
                  const bg = rate >= 60 ? '#059669' : rate >= 50 ? '#10b981' : rate >= 40 ? '#d97706' : '#ef4444';
                  return (
                    <td key={grade} className="px-1 py-1">
                      <div
                        className="w-full h-10 rounded flex flex-col items-center justify-center text-white"
                        style={{ background: bg, opacity: 0.65 + Math.min(cell.total / 15, 0.35) }}
                        title={`${model} / ${grade}: ${rate.toFixed(0)}% (${cell.pnl >= 0 ? '+' : ''}$${cell.pnl.toFixed(0)})`}
                      >
                        <span className="font-semibold">{rate.toFixed(0)}%</span>
                        <span className="text-[9px] opacity-70">${cell.pnl.toFixed(0)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

// ── Emotion Insight Panel ──────────────────────────────────
const EMOTION_EMOJI: Record<string, string> = {
  CALM: '😌', CONFIDENT: '💪', ANXIOUS: '😰',
  FOMO: '😤', REVENGE: '😡', NEUTRAL: '😐', TIRED: '😴'
};

export function EmotionInsightPanel({ data }: {
  data: Record<string, { followed: number; notFollowed: number; totalPnl: number; trades: number }>
}) {
  const rows = Object.entries(data).sort(([,a],[,b]) => b.trades - a.trades);
  if (!rows.length) return null;

  return (
    <ChartCard title="🧠 Emotion & Plan Insight">
      <div className="space-y-2">
        {rows.map(([emotion, val]) => {
          const planRate = val.trades > 0 ? (val.followed / val.trades) * 100 : 0;
          return (
            <div key={emotion} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{EMOTION_EMOJI[emotion] ?? '❓'}</span>
                  <span className="text-sm font-medium text-white">{emotion}</span>
                  <span className="text-xs text-gray-500">{val.trades} trades</span>
                </div>
                <span className={`text-sm font-bold ${val.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {val.totalPnl >= 0 ? '+' : ''}${val.totalPnl.toFixed(0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">Followed Plan</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${planRate >= 70 ? 'bg-emerald-500' : planRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${planRate}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-10 text-right ${planRate >= 70 ? 'text-emerald-400' : planRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {planRate.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ── Shared helpers ─────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <ChartCard title={label}>
      <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
        אין נתונים עדיין
      </div>
    </ChartCard>
  );
}