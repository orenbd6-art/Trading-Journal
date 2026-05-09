'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, BookOpen } from 'lucide-react';

const nav = [
  { href: '/',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trades/new', label: 'Add Trade', icon: PlusCircle },
  { href: '/trades',     label: 'Trade Log', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
      <h1 className="text-xl font-bold text-emerald-400 mb-8">📈 Trading Journal</h1>
      <nav className="space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
            ${pathname === href ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}