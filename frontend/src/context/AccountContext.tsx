'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type AccountType = 'FUNDED' | 'DEMO' | 'BACKTEST' | 'ALL';

interface AccountContextValue {
  account: AccountType;
  setAccount: (a: AccountType) => void;
}

const AccountContext = createContext<AccountContextValue>({
  account: 'DEMO',
  setAccount: () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountType>('DEMO');
  return (
    <AccountContext.Provider value={{ account, setAccount }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}