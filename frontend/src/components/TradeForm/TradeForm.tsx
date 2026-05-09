'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { tradesApi } from '@/services/api';
import { useState, useEffect, useRef } from 'react';
import { useAccount } from '@/context/AccountContext';

// ─── ScreenshotUploader Component ───────────────────────────────────────────

function ScreenshotUploader({
  files,
  previews,
  onAdd,
  onRemove,
}: {
  files: File[];
  previews: string[];
  onAdd: (newFiles: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) onAdd(pastedFiles);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onAdd]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (dropped.length > 0) onAdd(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onAdd(Array.from(e.target.files));
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-2
          w-full h-32 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200 select-none
          ${isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'}
        `}
      >
        <span className="text-3xl">{isDragging ? '📂' : '🖼️'}</span>
        <p className="text-sm text-gray-400 text-center">גרור תמונות לכאן או לחץ לבחירה</p>
        <p className="text-xs text-gray-600">
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">Ctrl+V</kbd> להדבקה • ניתן להוסיף מספר תמונות
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Previews Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-video">
              <img
                src={src}
                alt={`screenshot ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-700"
              />
              <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                ×
              </button>
            </div>
          ))}
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
          >
            <span className="text-gray-600 text-2xl">+</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
interface FormData {
  date: string;
  ticker: string;
  direction: 'LONG' | 'SHORT';
  session: string;

  // ✅ חדש
  entryTime?: string;
  exitTime?: string;
  entryModel?: string;
account?: string;
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
  screenshotUrls: any;
}

// שנה את השורה הזו:
export function TradeForm({ 
  defaultValues, 
  editId, 
  onSuccess 
}: { 
  defaultValues?: any; // שינוי ל-any יפתור את חוסר ההתאמה של ה-screenshotUrls
  editId?: string; 
  onSuccess?: () => void; 
}) {
  const router = useRouter();
  const { account } = useAccount();
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      direction: 'LONG',
      session: 'NEW_YORK_AM',
      setupGrade: 'A',
      emotionalState: 'CALM',
      followedPlan: false,
      contracts: 1,
      ...defaultValues,
    },
  });

  const entry     = watch('entry');
  const stop      = watch('stop');
  const target    = watch('target');
  const exit      = watch('exit');
  const contracts = watch('contracts');
  const direction = watch('direction');
  const pnl       = watch('pnl');

  // Auto RR
  useEffect(() => {
    if (entry && stop && target) {
      const risk   = Math.abs(Number(entry) - Number(stop));
      const reward = Math.abs(Number(target) - Number(entry));
      if (risk > 0) setValue('rr', parseFloat((reward / risk).toFixed(2)));
    }
  }, [entry, stop, target, setValue]);

  // Auto P&L
  useEffect(() => {
    if (entry && exit && contracts && direction) {
      const diff = direction === 'LONG'
        ? Number(exit) - Number(entry)
        : Number(entry) - Number(exit);
      setValue('pnl', parseFloat((diff * Number(contracts) * 20).toFixed(2)));
    }
  }, [entry, exit, contracts, direction, setValue]);
  // Auto Session by Entry Time
  const entryTime = watch('entryTime');
  useEffect(() => {
    if (!entryTime) return;
    const hours = parseInt(entryTime.split(':')[0], 10);
    let session = 'NEW_YORK_AM';
    if (hours >= 18)            session = 'ASIA';
    else if (hours < 6)         session = 'LONDON';
    else if (hours >= 6  && hours < 12) session = 'NEW_YORK_AM';
    else if (hours >= 12 && hours < 18) session = 'NEW_YORK_PM';
    setValue('session', session);
  }, [entryTime, setValue]);
  const onScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFiles(prev => [...prev, file]);
      setScreenshotPreviews(prev => [...prev, URL.createObjectURL(file)]);
    }
  };

  const onSubmit = async (data: FormData) => {
  setLoading(true);
  setError('');
  try {
    let screenshotUrls: string[] = data.screenshotUrls || [];
    
    // העלאת תמונות חדשות אם יש
    if (screenshotFiles.length > 0) {
      const newUrls = await tradesApi.uploadScreenshots(screenshotFiles);
      screenshotUrls = [...screenshotUrls, ...newUrls];
    }

    const payload = {
      ...data,
      ticker: data.ticker.toUpperCase(),
      account: account === 'ALL' ? (data.account || 'DEMO') : account,
      screenshotUrls,
    };

    if (editId) {
      // חשוב: השתמש ב-editId שמגיע מה-Props ולא ב-editingTrade
      await tradesApi.update(editId, payload);
    } else {
      await tradesApi.create(payload);
    }

    if (onSuccess) {
      onSuccess(); // סגירת המודאל ורענון ה-Log
    } else {
      router.push('/trades');
    }
  } catch (err: any) {
    console.error('Save error:', err);
    setError(err.response?.data?.error || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm";
  const lbl = "block text-xs text-gray-400 mb-1 font-medium";
  const er  = "text-red-400 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* שורה 1: Date, Ticker, Direction, Session */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={lbl}>Date *</label>
          <input type="date" {...register('date', { required: 'Required' })} className={inp} />
          {errors.date && <p className={er}>{errors.date.message}</p>}
        </div>
        <div>
          <label className={lbl}>Ticker *</label>
          <input
            {...register('ticker', { required: 'Required' })}
            placeholder="NQ, ES, AAPL..."
            className={inp}
            style={{ textTransform: 'uppercase' }}
          />
          {errors.ticker && <p className={er}>{errors.ticker.message}</p>}
        </div>
        <div>
          <label className={lbl}>Direction *</label>
          <select {...register('direction')} className={inp}>
            <option value="LONG">📈 Long</option>
            <option value="SHORT">📉 Short</option>
          </select>
        </div>
        <div>
  <label className={lbl}>Session (auto)</label>
  <input
    type="text"
    {...register('session')}
    readOnly
    placeholder="יתעדכן לפי Entry Time"
    className={`${inp} cursor-not-allowed opacity-70`}
  />
</div>
      </div>
{/* שורה 1.5: Entry Time, Exit Time, Entry Model */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label className={lbl}>Entry Time</label>
    <input
      type="time"
      {...register('entryTime')}
      className={inp}
    />
  </div>
  <div>
    <label className={lbl}>Exit Time</label>
    <input
      type="time"
      {...register('exitTime')}
      className={inp}
    />
  </div>
  <div>
    <label className={lbl}>Entry Model</label>
    <select {...register('entryModel')} className={inp}>
      <option value="">— ללא —</option>
      <option value="IFVG">IFVG</option>
      <option value="MODEL_2022">2022 Model</option>
      <option value="CISD">CISD</option>
      <option value="MSS">MSS</option>
      <option value="OTE">OTE</option>
      <option value="UNICORN">🦄 Unicorn Model</option>
    </select>
  </div>
</div>


      {/* שורה 2: Entry, Stop, Target, Exit */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={lbl}>Entry *</label>
          <input
            type="number" step="0.25"
            {...register('entry', { required: 'Required', valueAsNumber: true })}
            placeholder="21000" className={inp}
          />
          {errors.entry && <p className={er}>{errors.entry.message}</p>}
        </div>
        <div>
          <label className={lbl}>Stop *</label>
          <input
            type="number" step="0.25"
            {...register('stop', { required: 'Required', valueAsNumber: true })}
            placeholder="20950" className={inp}
          />
          {errors.stop && <p className={er}>{errors.stop.message}</p>}
        </div>
        <div>
          <label className={lbl}>Target *</label>
          <input
            type="number" step="0.25"
            {...register('target', { required: 'Required', valueAsNumber: true })}
            placeholder="21100" className={inp}
          />
          {errors.target && <p className={er}>{errors.target.message}</p>}
        </div>
        <div>
          <label className={lbl}>Exit</label>
          <input
            type="number" step="0.25"
            {...register('exit', { valueAsNumber: true })}
            placeholder="21080" className={inp}
          />
        </div>
      </div>

      {/* שורה 3: Contracts, P&L, RR, Setup Grade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={lbl}>Contracts *</label>
          <input
            type="number"
            step="any"
            {...register('contracts', { required: 'Required', valueAsNumber: true })}
            placeholder="1" className={inp}
          />
          {errors.contracts && <p className={er}>{errors.contracts.message}</p>}
        </div>
        <div>
          <label className={lbl}>P&L (auto)</label>
          <input
            type="number" step="0.01"
            {...register('pnl', { valueAsNumber: true })}
            placeholder="Auto"
            className={`${inp} ${pnl == null ? '' : pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}
          />
        </div>
        <div>
          <label className={lbl}>R:R (auto)</label>
          <input
            type="number" step="0.01"
            {...register('rr', { valueAsNumber: true })}
            placeholder="Auto"
            className={`${inp} text-blue-400`}
          />
        </div>
        <div>
          <label className={lbl}>Setup Grade *</label>
          <select {...register('setupGrade')} className={inp}>
            <option value="A_PLUS">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </div>

      {/* שורה 4: Emotional State, Followed Plan */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Emotional State *</label>
          <select {...register('emotionalState')} className={inp}>
            <option value="CALM">😌 Calm</option>
            <option value="CONFIDENT">💪 Confident</option>
            <option value="ANXIOUS">😰 Anxious</option>
            <option value="FOMO">😱 FOMO</option>
            <option value="REVENGE">😤 Revenge</option>
            <option value="NEUTRAL">😐 Neutral</option>
            <option value="TIRED">😴 Tired</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-5">
          <input
            type="checkbox"
            id="followedPlan"
            {...register('followedPlan')}
            className="w-5 h-5 accent-emerald-500 cursor-pointer"
          />
          <label htmlFor="followedPlan" className="text-white text-sm cursor-pointer select-none">
            Followed Plan?
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={lbl}>Notes</label>
        <textarea
  {...register('notes')}
  rows={4}
  dir="auto"
  placeholder="ICT setup, market structure, trade rationale..."
  className={`${inp} resize-none`}
/>
      </div>

     {/* Screenshots */}
<div>
  <label className={lbl}>Screenshots</label>
  <ScreenshotUploader
    files={screenshotFiles}
    previews={screenshotPreviews}
    onAdd={(newFiles) => {
      setScreenshotFiles(prev => [...prev, ...newFiles]);
      setScreenshotPreviews(prev => [
        ...prev,
        ...newFiles.map(f => URL.createObjectURL(f))
      ]);
    }}
    onRemove={(index) => {
      setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
      setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    }}
  />
</div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors text-sm"
      >
{loading ? '⏳ Saving...' : editId ? '💾 Update Trade' : '✅ Save Trade'}      </button>

    </form>
  );
}