'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Package,
  Wallet,
  GraduationCap,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { name: 'Ringkasan', href: '/dashboard', icon: LayoutGrid },
  { name: 'Inventaris Aset', href: '/dashboard/assets', icon: Package },
  { name: 'Keuangan BOS', href: '/dashboard/finance', icon: Wallet },
  { name: 'Data Siswa', href: '/dashboard/students', icon: GraduationCap },
  { name: 'Data Guru', href: '/dashboard/teachers', icon: Users },
  { name: 'Persuratan', href: '/dashboard/letters', icon: FileText },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Ringkasan',
  '/dashboard/assets': 'Inventaris Aset',
  '/dashboard/finance': 'Keuangan BOS',
  '/dashboard/students': 'Data Siswa',
  '/dashboard/teachers': 'Data Guru',
  '/dashboard/letters': 'Persuratan',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('smavo_token');
    const raw = localStorage.getItem('smavo_user');
    if (!token) { router.push('/login'); return; }
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('smavo_token');
    localStorage.removeItem('smavo_refresh_token');
    localStorage.removeItem('smavo_user');
    router.push('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : '?';

  const title = TITLES[pathname] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-[260px] bg-sidebar flex flex-col',
        'transition-transform duration-300 lg:translate-x-0 lg:static',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-6 h-[65px] shrink-0 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">S</span>
          </div>
          <div className="flex-1">
            <span className="text-white font-bold text-lg tracking-tight leading-none">SMAVO</span>
            <span className="block text-white/25 text-[9px] uppercase tracking-[0.2em] leading-none mt-1">
              SMAN 2 Cibinong
            </span>
          </div>
          <button className="lg:hidden text-white/30 hover:text-white" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">
            Menu Utama
          </p>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                )}
              >
                <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName || '...'}</p>
              <p className="text-[11px] text-white/25 truncate capitalize">
                {user?.role?.toLowerCase().replace('_', ' ') || ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-xl text-sm
                       text-white/30 hover:text-rose-400 hover:bg-white/[0.03] transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fadeIn" onClick={() => setOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border h-[65px] flex items-center px-4 lg:px-8 gap-4 shrink-0">
          <button className="lg:hidden text-muted hover:text-foreground" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
          <div className="flex-1" />
          <button className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-gray-100 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <div className="hidden sm:flex items-center gap-2.5 pl-4 ml-1 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{user?.fullName || ''}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
