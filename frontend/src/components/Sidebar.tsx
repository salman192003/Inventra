'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Bot,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Inventory',    href: '/inventory',   icon: Package },
  { label: 'Sales',        href: '/sales',       icon: ShoppingCart },
  { label: 'Insights',     href: '/insights',    icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm tracking-tight">Inventra</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-500' : 'text-slate-400')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Settings pinned bottom */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-indigo-50 text-indigo-600 font-medium'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          )}
        >
          <Settings className={cn('w-4 h-4 shrink-0', pathname === '/settings' ? 'text-indigo-500' : 'text-slate-400')} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
