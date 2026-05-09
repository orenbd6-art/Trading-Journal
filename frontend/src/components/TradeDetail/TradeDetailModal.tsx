'use client';
import { Trade } from '@/types/trade';
import { format } from 'date-fns';
import { useEffect, useState, useRef } from 'react';

interface Props {
  trade: Trade;
  onClose: () => void;
}
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  // Reset כשמשנים תמונה
  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    e.preventDefault();
    setDragging(true);
    setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  // Touch support
  const lastTouchDist = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1 && scale > 1) {
      setDragging(true);
      setStartPos({ x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = (dist - lastTouchDist.current) * 0.01;
      lastTouchDist.current = dist;
      setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
    } else if (e.touches.length === 1 && dragging) {
      setPos({ x: e.touches[0].clientX - startPos.x, y: e.touches[0].clientY - startPos.y });
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    lastTouchDist.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden rounded-xl bg-gray-900 relative flex items-center justify-center select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
          transition: dragging ? 'none' : 'transform 0.15s ease',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: '0.5rem',
        }}
      />

      {/* HUD */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <button
          onClick={() => { setScale(s => Math.max(MIN_SCALE, s - 0.5)); if (scale <= 1.5) setPos({x:0,y:0}); }}
          className="w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm transition-colors"
        >−</button>
        <span className="text-white text-xs bg-black/60 px-2 py-1 rounded-full min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(MAX_SCALE, s + 0.5))}
          className="w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm transition-colors"
        >+</button>
        {scale > 1 && (
          <button
            onClick={() => { setScale(1); setPos({x:0,y:0}); }}
            className="text-white text-xs bg-black/60 hover:bg-black/80 px-2 py-1 rounded-full transition-colors"
          >Reset</button>
        )}
      </div>

      <p className="absolute bottom-3 right-3 text-gray-600 text-xs">
        גלגל עכבר לזום • גרור להזזה • דאבל-קליק לזום מהיר
      </p>
    </div>
  );
}
export function TradeDetailModal({ trade, onClose }: Props) {
  const [imgFullscreen, setImgFullscreen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // פירוק screenshotUrls מ-JSON string או מערך
  const urls: string[] = (() => {
    try {
      if (!trade.screenshotUrls) return [];
      if (Array.isArray(trade.screenshotUrls)) return trade.screenshotUrls;
      return JSON.parse(trade.screenshotUrls as string);
    } catch { return []; }
  })();

  // סגירה עם ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imgFullscreen) setImgFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgFullscreen, onClose]);

  // מניעת scroll ברקע
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const pnlColor = trade.pnl == null ? 'text-gray-400'
    : trade.pnl > 0 ? 'text-emerald-400'
    : 'text-red-400';

  const fields = [
  { label: 'תאריך',       value: format(new Date(trade.date), 'dd/MM/yyyy') },
  { label: 'Ticker',      value: trade.ticker },
  { label: 'Direction',   value: trade.direction === 'LONG' ? '↑ Long' : '↓ Short',
    color: trade.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400' },
  { label: 'Session',     value: trade.session.replace('_', ' ') },

  // ✅ חדש
  { label: 'Entry Time',  value: trade.entryTime ?? '—' },
  { label: 'Exit Time',   value: trade.exitTime ?? '—' },
  { label: 'Entry Model', value: trade.entryModel
      ? ({ IFVG:'IFVG', MODEL_2022:'2022 Model', CISD:'CISD',
           MSS:'MSS', OTE:'OTE', UNICORN:'🦄 Unicorn' } as any)[trade.entryModel] ?? trade.entryModel
      : '—',
    color: trade.entryModel ? 'text-purple-400' : 'text-gray-500'
  },

  { label: 'Entry',       value: trade.entry },
  { label: 'Stop',        value: trade.stop },
  { label: 'Target',      value: trade.target },
  { label: 'Exit',        value: trade.exit ?? '—' },
  { label: 'Contracts',   value: trade.contracts },
  { label: 'P&L',         value: trade.pnl != null ? `$${trade.pnl.toFixed(2)}` : '—', color: pnlColor },
  { label: 'R:R',         value: trade.rr ? `${trade.rr}R` : '—', color: 'text-blue-400' },
  { label: 'Setup Grade', value: trade.setupGrade.replace('_PLUS', '+'), color: 'text-yellow-400' },
  { label: 'Emotion',     value: trade.emotionalState },
  { label: 'Followed Plan', value: trade.followedPlan ? 'Yes ✅' : 'No ❌' },
];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 z-50 bg-gray-900 rounded-2xl border border-gray-700 flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{trade.ticker}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              trade.direction === 'LONG'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {trade.direction === 'LONG' ? '↑ Long' : '↓ Short'}
            </span>
            <span className="text-gray-400 text-sm">
              {format(new Date(trade.date), 'dd/MM/yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-2xl font-bold ${pnlColor}`}>
              {trade.pnl != null ? `$${trade.pnl.toFixed(0)}` : 'Open'}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── צד שמאל: Screenshots ── */}
<div className="flex-1 bg-gray-950 flex flex-col p-4 border-r border-gray-800 min-w-0 overflow-hidden">
  {urls.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
      <span className="text-6xl">🖼️</span>
      <p className="text-sm">אין Screenshots</p>
    </div>
  ) : (
    <>
      {/* תמונה ראשית עם Zoom + Pan */}
      <ZoomableImage
        src={`${apiBase}${urls[activeImg]}`}
        alt="screenshot"
      />

      {/* Thumbnails */}
      {urls.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 shrink-0">
          {urls.map((url, i) => (
            <img
              key={i}
              src={`${apiBase}${url}`}
              alt={`thumb ${i + 1}`}
              onClick={() => setActiveImg(i)}
              className={`h-14 w-20 object-cover rounded-lg cursor-pointer shrink-0 transition-all border-2 ${
                activeImg === i
                  ? 'border-emerald-400 opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )}
</div>

          {/* ── צד ימין: פרטים ── */}
          <div className="w-80 shrink-0 overflow-y-auto p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {fields.map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-sm font-semibold truncate ${color ?? 'text-white'}`}>
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>

            {trade.notes && (
  <div className="mt-4 bg-gray-800 rounded-lg p-3">
    <p className="text-xs text-gray-500 mb-1">Notes</p>
    <p
      dir="auto"
      className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap"
    >
      {trade.notes}
    </p>
  </div>
)}

            <p className="text-center text-xs text-gray-600 pt-2">
              לחץ ESC או מחוץ לחלון לסגירה
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen */}
      {imgFullscreen && urls.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImgFullscreen(false)}
        >
          <img
            src={`${apiBase}${urls[activeImg]}`}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setImgFullscreen(false)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}