'use client';
import { useAccount, AccountType } from '@/context/AccountContext';

const ACCOUNTS: { value: AccountType; label: string; color: string; dot: string }[] = [
  { value: 'ALL',      label: 'All Accounts', color: 'text-gray-300',    dot: 'bg-gray-500'    },
  { value: 'FUNDED',   label: 'Funded',       color: 'text-emerald-400', dot: 'bg-emerald-400' },
  { value: 'DEMO',     label: 'Demo',         color: 'text-blue-400',    dot: 'bg-blue-400'    },
  { value: 'BACKTEST', label: 'Backtest',     color: 'text-purple-400',  dot: 'bg-purple-400'  },
];

export function AccountSwitcher() {
  const { account, setAccount } = useAccount();

  return (
    <div className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-8 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-2 font-medium uppercase tracking-wider">Account</span>
        {ACCOUNTS.map(({ value, label, color, dot }) => (
          <button
            key={value}
            onClick={() => setAccount(value)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${account === value
                ? `bg-gray-800 ${color} ring-1 ring-gray-600`
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${dot} ${account === value ? 'opacity-100' : 'opacity-40'}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}