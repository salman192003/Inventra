'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';

interface NavbarProps {
  readonly title: string;
  readonly subtitle?: string;
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const business = useAuthStore((s) => s.business);
  const logout = useLogout();

  // Derive initials from fullName
  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const displayName = user?.fullName
    ? user.fullName.split(' ').slice(0, 2).join(' ')
    : 'User';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
      {/* Left: Page title */}
      <div>
        <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      {/* Right: Search + actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 w-56">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-full"
          />
        </div>

        {/* Notification */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-600">{initials}</span>
            </div>
            <span className="hidden md:block text-xs font-medium text-slate-700">{displayName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-100 z-50 py-1 overflow-hidden">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-slate-50">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.fullName ?? 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email ?? ''}</p>
                {business && (
                  <span className="inline-block mt-1 text-[10px] bg-indigo-50 text-indigo-600 font-medium px-1.5 py-0.5 rounded-full">
                    {business.name}
                  </span>
                )}
              </div>

              {/* Actions */}
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Settings
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile
              </Link>

              <div className="border-t border-slate-50 mt-1 pt-1">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
