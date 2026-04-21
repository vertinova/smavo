'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutGrid, Package, Wallet, GraduationCap, Users, FileText,
  LogOut, Menu, X, UserCog, ShieldAlert, Sun, Moon, Palette, KeyRound,
  Settings, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/lib/theme';
import { isStandaloneMode } from '@/lib/pwa';
import ChangePasswordModal from './components/ChangePasswordModal';

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

// Nav items visible to SISWA role
const SISWA_NAV = [
  { name: 'Ringkasan', href: '/dashboard', icon: LayoutGrid },
  { name: 'Kedisiplinan', href: '/dashboard/discipline', icon: ShieldAlert },
];

// Routes that SISWA is allowed to access
const SISWA_ALLOWED_ROUTES = ['/dashboard', '/dashboard/discipline'];

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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDefaultPwWarning, setShowDefaultPwWarning] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'colorful', icon: Palette, label: 'Color' },
  ];

  useEffect(() => {
    // PWA gate: only allow dashboard in standalone/installed mode
    if (!isStandaloneMode()) { router.replace('/'); return; }

    const token = localStorage.getItem('smavo_token');
    const raw = localStorage.getItem('smavo_user');
    if (!token) { router.push('/login'); return; }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        // SISWA role: redirect if accessing non-allowed routes
        if (parsed.role === 'SISWA' && !SISWA_ALLOWED_ROUTES.includes(pathname)) {
          router.push('/dashboard');
        }
        // Check if user hasn't changed default password yet
        if (parsed.role !== 'ADMIN' && !localStorage.getItem('smavo_pw_changed')) {
          setShowDefaultPwWarning(true);
        }
      } catch { /* ignore */ }
    }
  }, [router, pathname]);

  const logout = () => {
    localStorage.removeItem('smavo_token');
    localStorage.removeItem('smavo_refresh_token');
    localStorage.removeItem('smavo_user');
    localStorage.removeItem('smavo_pw_changed');
    router.push('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : '?';

  const title = TITLES[pathname] || 'Dashboard';

  // Compute filtered nav items
  const filteredNav = user?.role === 'SISWA' ? SISWA_NAV : NAV.filter(item => {
    if ('adminOnly' in item) return user?.role === 'ADMIN';
    if (!('feature' in item)) return true;
    if (user?.role === 'ADMIN') return true;
    return (user?.allowedFeatures ?? []).includes(item.feature!);
  });

  // Mobile bottom bar: show max 4 items + "more" if needed
  const mobileNavItems = filteredNav.slice(0, 4);
  const mobileOverflowItems = filteredNav.slice(4);
  const hasOverflow = mobileOverflowItems.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-[220px] sidebar-surface border-r border-border flex-col',
        'transition-transform duration-300 lg:translate-x-0 lg:static',
        'hidden lg:flex',
        open ? 'translate-x-0 !flex' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-border">
          <Image src="/logo-smavo.jpeg" alt="SMAVO" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shadow-md" />
          <div className="flex-1">
            <span className="text-foreground font-bold text-sm tracking-tight leading-none">SMAVO</span>
            <span className="block text-[10px] text-muted tracking-[0.15em] uppercase leading-none mt-0.5">SMAN 2 Cibinong</span>
          </div>
          <button className="lg:hidden text-muted hover:text-foreground" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-2 pt-3 pb-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-1.5 text-[9px] font-semibold text-muted uppercase tracking-widest">Menu</p>
          {filteredNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200',
                  active ? 'sidebar-nav-active' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                )}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />}
                <item.icon size={17} strokeWidth={active ? 2 : 1.5} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-2 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg sidebar-user-avatar flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.fullName || '...'}</p>
              <p className="text-[10px] text-muted truncate capitalize">{user?.role?.toLowerCase().replace('_', ' ') || ''}</p>
            </div>
          </div>
          <button onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-2 px-3 py-1.5 w-full rounded-lg text-[12px] text-muted hover:text-accent hover:bg-accent-muted transition-all">
            <KeyRound size={15} /> Ubah Password
          </button>
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 w-full rounded-lg text-[12px] text-muted hover:text-danger hover:bg-danger-muted transition-all">
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fadeIn" onClick={() => setOpen(false)} />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border h-12 flex items-center px-4 lg:px-6 gap-3 shrink-0">
          <button className="lg:hidden text-muted hover:text-foreground transition-colors" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-border">
            {THEMES.map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={cn('p-1.5 rounded-md transition-all duration-200',
                  theme === t.value ? 'bg-accent/10 text-accent shadow-sm' : 'text-muted hover:text-foreground'
                )} title={t.label}>
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

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 animate-fadeIn">
          {children}
        </main>
      </div>

      {/* ═══ Mobile Bottom Navigation Bar ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="mobile-bottom-bar">
          <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
            {mobileNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all duration-300',
                    active ? 'text-accent' : 'text-muted hover:text-foreground'
                  )}>
                  <div className={cn(
                    'relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300',
                    active && 'bg-accent/12 scale-110'
                  )}>
                    <item.icon size={20} strokeWidth={active ? 2.2 : 1.5}
                      className={cn('transition-all duration-300', active && 'drop-shadow-[0_0_8px_rgb(var(--accent)/0.4)]')} />
                    {active && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent animate-fadeIn" />}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium leading-none transition-all duration-300',
                    active && 'font-semibold'
                  )}>{item.name.length > 8 ? item.name.split(' ')[0] : item.name}</span>
                </Link>
              );
            })}

            {/* More/Settings button */}
            <button onClick={() => setShowMoreMenu(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all duration-300',
                showMoreMenu ? 'text-accent' : 'text-muted hover:text-foreground'
              )}>
              <div className="flex items-center justify-center w-10 h-7">
                {hasOverflow ? <MoreHorizontal size={20} strokeWidth={1.5} /> : <Settings size={20} strokeWidth={1.5} />}
              </div>
              <span className="text-[10px] font-medium leading-none">{hasOverflow ? 'Lainnya' : 'Menu'}</span>
            </button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>

      {/* ═══ Mobile "More" Menu Sheet ═══ */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fadeIn" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl animate-slideUp overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-4 pb-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/[0.03] mb-3">
                <div className="w-10 h-10 rounded-xl header-avatar flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || '...'}</p>
                  <p className="text-xs text-muted capitalize">{user?.role?.toLowerCase().replace('_', ' ') || ''}</p>
                </div>
              </div>

              {mobileOverflowItems.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted uppercase tracking-widest font-semibold px-1 mb-2">Menu Lainnya</p>
                  <div className="grid grid-cols-3 gap-2">
                    {mobileOverflowItems.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setShowMoreMenu(false)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all',
                            active ? 'bg-accent/10 text-accent' : 'bg-foreground/[0.03] text-muted-foreground hover:bg-foreground/[0.06]'
                          )}>
                          <item.icon size={20} strokeWidth={1.5} />
                          <span className="text-[10px] font-medium text-center leading-tight">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="text-[10px] text-muted uppercase tracking-widest font-semibold px-1 mb-2">Tema</p>
                <div className="flex gap-2">
                  {THEMES.map((t) => (
                    <button key={t.value} onClick={() => setTheme(t.value)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all',
                        theme === t.value ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-foreground/[0.03] text-muted-foreground border border-transparent'
                      )}>
                      <t.icon size={14} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <button onClick={() => { setShowMoreMenu(false); setShowChangePassword(true); }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-sm text-muted-foreground hover:bg-foreground/[0.03] transition-all">
                  <KeyRound size={18} /> Ubah Password
                </button>
                <button onClick={() => { setShowMoreMenu(false); logout(); }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-sm text-danger hover:bg-danger-muted transition-all">
                  <LogOut size={18} /> Keluar
                </button>
              </div>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <ChangePasswordModal open={showDefaultPwWarning && !showChangePassword} onClose={() => setShowDefaultPwWarning(false)} forced />
    </div>
  );
}
