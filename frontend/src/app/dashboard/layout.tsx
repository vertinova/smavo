'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutGrid, Package, Wallet, GraduationCap, Users, FileText,
  LogOut, Menu, X, UserCog, ShieldAlert, Sun, Moon, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/lib/theme';

const NAV = [
  { name: 'Ringkasan', href: '/dashboard', icon: LayoutGrid },
  { name: 'Inventaris Aset', href: '/dashboard/assets', icon: Package, feature: 'assets' },
  { name: 'Keuangan BOS', href: '/dashboard/finance', icon: Wallet, feature: 'finance' },
  { name: 'Data Siswa', href: '/dashboard/students', icon: GraduationCap, feature: 'students' },
  { name: 'Data Guru', href: '/dashboard/teachers', icon: Users, feature: 'teachers' },
  { name: 'Persuratan', href: '/dashboard/letters', icon: FileText, feature: 'letters' },
  { name: 'Kedisiplinan', href: '/dashboard/discipline', icon: ShieldAlert, feature: 'discipline' },
  { name: 'Akun & Role', href: '/dashboard/users', icon: UserCog, adminOnly: true },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Ringkasan',
  '/dashboard/assets': 'Inventaris Aset',
  '/dashboard/finance': 'Keuangan BOS',
  '/dashboard/students': 'Data Siswa',
  '/dashboard/teachers': 'Data Guru',
  '/dashboard/letters': 'Persuratan',
  '/dashboard/discipline': 'Kedisiplinan',
  '/dashboard/users': 'Akun & Role',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();

  const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'colorful', icon: Palette, label: 'Color' },
  ];

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-[220px] sidebar-surface border-r border-border flex flex-col',
        'transition-transform duration-300 lg:translate-x-0 lg:static',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-border">
          <div className="w-8 h-8 rounded-lg sidebar-brand-icon flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <div className="flex-1">
            <span className="text-foreground font-bold text-sm tracking-tight leading-none">SMAVO</span>
            <span className="block text-[10px] text-muted tracking-[0.15em] uppercase leading-none mt-0.5">
              SMAN 2 Cibinong
            </span>
          </div>
          <button className="lg:hidden text-muted hover:text-foreground" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-3 pb-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-1.5 text-[9px] font-semibold text-muted uppercase tracking-widest">Menu</p>
          {NAV.filter(item => {
            if ('adminOnly' in item) return user?.role === 'ADMIN';
            if (!('feature' in item)) return true; // dashboard, no feature required
            if (user?.role === 'ADMIN') return true; // admin sees all
            return (user?.allowedFeatures ?? []).includes(item.feature!);
          }).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200',
                  active
                    ? 'sidebar-nav-active'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <item.icon size={17} strokeWidth={active ? 2 : 1.5} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-2 py-2 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg sidebar-user-avatar flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.fullName || '...'}</p>
              <p className="text-[10px] text-muted truncate capitalize">
                {user?.role?.toLowerCase().replace('_', ' ') || ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 mt-0.5 w-full rounded-lg text-[12px]
                       text-muted hover:text-danger hover:bg-danger-muted transition-all"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fadeIn" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border h-12 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button className="lg:hidden text-muted hover:text-foreground transition-colors" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          <div className="flex-1" />

          {/* Theme Switcher */}
          <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-border">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'p-1.5 rounded-md transition-all duration-200',
                  theme === t.value
                    ? 'bg-accent/10 text-accent shadow-sm'
                    : 'text-muted hover:text-foreground'
                )}
                title={t.label}
              >
                <t.icon size={14} strokeWidth={theme === t.value ? 2 : 1.5} />
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg header-avatar flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{user?.fullName || ''}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
