'use client';
import { AccountProvider } from '@/context/AccountContext';
import { Sidebar } from '@/components/ui/Sidebar';
import { AccountSwitcher } from '@/components/ui/AccountSwitcher';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <div className="min-h-screen md:flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <AccountSwitcher />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </AccountProvider>
  );
}