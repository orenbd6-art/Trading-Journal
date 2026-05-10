'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/',            label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trades/new',  label: 'Add Trade',  icon: PlusCircle },
  { href: '/trades',      label: 'Trade Log',  icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* כפתור hamburger — מובייל בלבד */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
        aria-label="פתח תפריט"
      >
        <Menu size={22} />
      </button>

      {/* Overlay — מובייל בלבד */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-0
      `}>
        {/* כפתור סגירה — מובייל בלבד */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="סגור תפריט"
        >
          <X size={22} />
        </button>

        <h1 className="text-xl font-bold text-emerald-400 mb-8">
          📈 Trading Journal
        </h1>

        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${pathname === href
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}