'use client';
import { useEffect, useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { tradesApi } from '@/services/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Stats {
  totalTrades: number; closedTrades: number; winRate: number; totalPnL: number;
  avgWin: number; avgLoss: number; profitFactor: number | null; expectancy: number;
  avgHoldingMin: number; followedPlanRate: number; bestTrade: any; worstTrade: any;
  byGrade: Record<string, { wins: number; total: number; pnl: number }>;
  byEmotion: Record<string, { wins: number; total: number; pnl: number }>;
  bySession: Record<string, { wins: number; total: number; pnl: number }>;
  byModel: Record<string, { wins: number; total: number; pnl: number }>;
  byDirection: Record<string, { wins: number; total: number; pnl: number }>;
  dailyPnL: Record<string, number>;
  equityCurve: { date: string; equity: number; drawdown: number }[];
  daySessionMap: Record<string, Record<string, { wins: number; total: number }>>;
  modelGradeMap: Record<string, Record<string, { wins: number; total: number; pnl: number }>>;
  emotionPlanMap: Record<string, { followed: number; notFollowed: number; totalPnl: number; trades: number }>;
}

const SESSIONS = ['LONDON', 'NY AM', 'NY PM', 'ASIA', 'Pre', 'OVERLAP'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const GRADES = ['A+','A','B','C','D'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function d$(n?: number | null) { if (n==null) return '—'; return `$${n<0?'-':''}${Math.abs(n).toFixed(0)}`; }
function p$(n?: number | null) { if (n==null) return '—'; return `${Number(n).toFixed(1)}%`; }
function wc(r: number) { return r>=60?'text-emerald-400':r>=50?'text-yellow-400':'text-red-400'; }
function pc(n?: number | null) { if(n==null) return 'text-gray-400'; return n>0?'text-emerald-400':n<0?'text-red-400':'text-gray-400'; }

function KPI({label,value,sub,cls}:{label:string;value:string;sub?:string;cls?:string}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${cls??'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function WBar({label,wins,total}:{label:string;wins:number;total:number}) {
  const r = total>0?(wins/total)*100:0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span><span>{p$(r)} ({wins}/{total})</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{width:`${r}%`}}/>
      </div>
    </div>
  );
}

function PTable({title,data}:{title:string;data:Record<string,{wins:number;total:number;pnl:number}>}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-gray-400 text-sm font-semibold mb-3">{title}</p>
      <table className="w-full text-xs">
        <thead><tr className="text-gray-600 border-b border-gray-800">
          <th className="text-left pb-2">Name</th>
          <th className="text-right pb-2">Trades</th>
          <th className="text-right pb-2">Win%</th>
          <th className="text-right pb-2">P&L</th>
        </tr></thead>
        <tbody>
          {Object.entries(data??{}).map(([n,d])=>{
            const r=d.total>0?(d.wins/d.total)*100:0;
            return (<tr key={n} className="border-b border-gray-800/40">
              <td className="py-1.5 text-gray-300">{n}</td>
              <td className="py-1.5 text-right text-gray-400">{d.total}</td>
              <td className={`py-1.5 text-right ${wc(r)}`}>{p$(r)}</td>
              <td className={`py-1.5 text-right ${pc(d.pnl)}`}>{d$(d.pnl)}</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  );
}

function Heatmap({dailyPnL}:{dailyPnL:Record<string,number>}) {
  const today=new Date(); const start=new Date(today); start.setFullYear(today.getFullYear()-1);
  const cur=new Date(start); cur.setDate(cur.getDate()-cur.getDay());
  const weeks:{date:string;pnl:number|null}[][]=[];
  while(cur<=today){
    const w:{date:string;pnl:number|null}[]=[];
    for(let d=0;d<7;d++){const ds=cur.toISOString().split('T')[0];w.push({date:ds,pnl:dailyPnL[ds]??null});cur.setDate(cur.getDate()+1);}
    weeks.push(w);
  }
  const mp:{label:string;idx:number}[]=[]; let lm=-1;
  weeks.forEach((w,i)=>{const m=new Date(w[1]?.date??w[0].date).getMonth();if(m!==lm){mp.push({label:MONTHS[m],idx:i});lm=m;}});
  function cc(p:number|null){if(p===null)return'bg-gray-800';if(p>500)return'bg-emerald-400';if(p>200)return'bg-emerald-600';if(p>0)return'bg-emerald-800';if(p<-500)return'bg-red-400';if(p<-200)return'bg-red-600';return'bg-red-800';}
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex ml-10 mb-2">
          {weeks.map((_,i)=>{
            const m=mp.find(x=>x.idx===i);
            return <div key={i} className="w-5 shrink-0 text-[11px] text-gray-500">{m?m.label:''}</div>;
          })}
        </div>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2 w-8">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((l,i)=>(
              <div key={i} className="text-[11px] text-gray-500 h-5 flex items-center justify-end pr-1">{l}</div>
            ))}
          </div>
          {/* Grid */}
          {weeks.map((week,wi)=>(
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day,di)=>(
                <div
                  key={di}
                  title={day.pnl!=null?`${day.date}: $${day.pnl.toFixed(0)}`:day.date}
                  className={`w-5 h-5 rounded ${cc(day.pnl)} hover:opacity-80 transition-opacity cursor-default`}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-10 text-[11px] text-gray-500">
          <span>Loss</span>
          {['bg-red-400','bg-red-600','bg-red-800','bg-gray-800','bg-emerald-800','bg-emerald-600','bg-emerald-400'].map(c=>(
            <div key={c} className={`w-5 h-5 rounded ${c}`}/>
          ))}
          <span>Win</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {
  const {account}=useAccount();
  const [stats,setStats]=useState<Stats|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    setLoading(true);
    const ap=account!=='ALL'?account:undefined;
    tradesApi.getStats(ap).then((d:any)=>setStats(d)).finally(()=>setLoading(false));
  },[account]);

  if(loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500 text-lg">Loading...</div></div>;
  if(!stats||stats.totalTrades===0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-5xl">📋</p><p className="text-gray-400 text-lg">No trades yet</p>
      <Link href="/trades/new" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">+ Add Trade</Link>
    </div>
  );

  const pnl=stats.totalPnL??0; const wr=stats.winRate??0;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.closedTrades} closed trades · {stats.totalTrades} total</p>
        </div>
        <Link href="/trades/new" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">+ Add Trade</Link>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Net P&L" value={d$(pnl)} cls={pc(pnl)}/>
        <KPI label="Win Rate" value={p$(wr)} sub={`${stats.closedTrades} trades`} cls={wc(wr)}/>
        <KPI label="Profit Factor" value={stats.profitFactor!=null?stats.profitFactor.toFixed(2):'—'}/>
        <KPI label="Expectancy" value={d$(stats.expectancy)} sub="per trade" cls={pc(stats.expectancy)}/>
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Avg Win" value={d$(stats.avgWin)} cls="text-emerald-400"/>
        <KPI label="Avg Loss" value={d$(stats.avgLoss)} cls="text-red-400"/>
        <KPI label="Avg Holding Time" value={stats.avgHoldingMin>0?`${Math.round(stats.avgHoldingMin)}m`:'—'}/>
        <KPI label="Followed Plan" value={p$(stats.followedPlanRate)} cls={wc(stats.followedPlanRate)}/>
      </div>

      {/* Best / Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bestTrade&&(
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
            <p className="text-emerald-400 text-xs font-semibold mb-2">🏆 Best Trade</p>
            <p className="text-emerald-300 text-2xl font-bold">+{d$(stats.bestTrade.pnl)}</p>
            <p className="text-gray-500 text-xs mt-1">{stats.bestTrade.ticker} · {stats.bestTrade.direction} · {stats.bestTrade.date?format(new Date(stats.bestTrade.date),'d.M.yyyy'):''}</p>
          </div>
        )}
        {stats.worstTrade&&(
          <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4">
            <p className="text-red-400 text-xs font-semibold mb-2">💥 Worst Trade</p>
            <p className="text-red-300 text-2xl font-bold">{d$(stats.worstTrade.pnl)}</p>
            <p className="text-gray-500 text-xs mt-1">{stats.worstTrade.ticker} · {stats.worstTrade.direction} · {stats.worstTrade.date?format(new Date(stats.worstTrade.date),'d.M.yyyy'):''}</p>
          </div>
        )}
      </div>

      {/* Win Rate bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-semibold mb-3">📊 Win Rate by Setup Grade</p>
          <div className="space-y-2">{Object.entries(stats.byGrade??{}).sort().map(([g,d])=><WBar key={g} label={g} wins={d.wins} total={d.total}/>)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-semibold mb-3">🧠 Win Rate by Emotional State</p>
          <div className="space-y-2">{Object.entries(stats.byEmotion??{}).map(([e,d])=><WBar key={e} label={e} wins={d.wins} total={d.total}/>)}</div>
        </div>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PTable title="🕐 Performance by Session" data={stats.bySession}/>
        <PTable title="📐 Performance by Entry Model" data={stats.byModel}/>
        <PTable title="↕️ Long vs Short" data={stats.byDirection}/>
      </div>

      {/* Equity + Drawdown */}
      {stats.equityCurve&&stats.equityCurve.length>1&&(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm font-semibold mb-3">📈 Equity Curve</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={stats.equityCurve}>
                <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="date" hide/>
                <YAxis width={58} tick={{fill:'#6b7280',fontSize:10}} tickFormatter={(v:number)=>`$${v}`}/>
                <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}} formatter={(v:any)=>[`$${v}`,'Equity']}/>
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fill="url(#eg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm font-semibold mb-3">📉 Drawdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={stats.equityCurve}>
                <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="date" hide/>
                <YAxis width={45} tick={{fill:'#6b7280',fontSize:10}} tickFormatter={(v:number)=>`${v}%`}/>
                <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}} formatter={(v:any)=>[`${v}%`,'Drawdown']}/>
                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#dg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {stats.dailyPnL&&Object.keys(stats.dailyPnL).length>0&&(
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-semibold mb-4">📅 Trading Activity (Last 12 Months)</p>
          <Heatmap dailyPnL={stats.dailyPnL}/>
        </div>
      )}

      {/* Day x Session + Model x Grade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-semibold mb-3">🗓️ Win Rate: Day × Session</p>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-600"><th className="text-left py-1 pr-3">Day</th>{SESSIONS.map(s=><th key={s} className="text-center py-1 px-1">{s}</th>)}</tr></thead>
            <tbody>{DAYS.map(day=>(
              <tr key={day} className="border-t border-gray-800/40">
                <td className="py-1.5 pr-3 text-gray-400 font-medium">{day}</td>
                {SESSIONS.map(sess=>{
                  const d=stats.daySessionMap?.[day]?.[sess];
                  if(!d||d.total===0) return <td key={sess} className="py-1 px-1 text-center text-gray-800">—</td>;
                  const r=(d.wins/d.total)*100;
                  const bg=r>=60?'bg-emerald-600':r>=40?'bg-yellow-600':'bg-red-700';
                  return <td key={sess} className="py-1 px-1 text-center"><span className={`${bg} text-white text-[10px] px-1.5 py-0.5 rounded inline-block`}>{Math.round(r)}%<span className="block text-[9px] opacity-75">{d.wins}/{d.total}</span></span></td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-semibold mb-3">🗺️ Setup Map: Entry Model × Grade</p>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-600"><th className="text-left py-1 pr-3">Model</th>{GRADES.map(g=><th key={g} className="text-center py-1 px-1">{g}</th>)}</tr></thead>
            <tbody>{Object.entries(stats.modelGradeMap??{}).map(([model,grades])=>(
              <tr key={model} className="border-t border-gray-800/40">
                <td className="py-1.5 pr-3 text-gray-400 font-medium">{model}</td>
                {GRADES.map(grade=>{
                  const d=grades[grade];
                  if(!d||d.total===0) return <td key={grade} className="py-1 px-1 text-center text-gray-800">—</td>;
                  const r=(d.wins/d.total)*100;
                  const bg=r>=60?'bg-emerald-600':r>=40?'bg-yellow-600':'bg-red-700';
                  return <td key={grade} className="py-1 px-1 text-center"><span className={`${bg} text-white text-[10px] px-1.5 py-0.5 rounded inline-block`}>{Math.round(r)}%<span className="block text-[9px] opacity-75">{d.total}t</span></span></td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Emotion & Plan */}
      {stats.emotionPlanMap&&Object.keys(stats.emotionPlanMap).length>0&&(
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-semibold mb-4">😌 Emotion & Plan Insight</p>
          <div className="space-y-5">{Object.entries(stats.emotionPlanMap).map(([emotion,d])=>{
            const fp=d.trades>0?(d.followed/d.trades)*100:0;
            const em=emotion==='CALM'?'🟡':emotion==='TIRED'?'🟠':emotion==='FOMO'?'🔴':'⚪';
            return (
              <div key={emotion}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-300 font-semibold">{em} {emotion} <span className="text-gray-600 ml-1">{d.trades} trades</span></span>
                  <span className={pc(d.totalPnl)}>{d$(d.totalPnl)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs w-24 shrink-0">Followed Plan</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{width:`${fp}%`}}/>
                  </div>
                  <span className={`text-xs w-10 text-right ${wc(fp)}`}>{p$(fp)}</span>
                </div>
              </div>
            );
          })}</div>
        </div>
      )}

    </div>
  );
}