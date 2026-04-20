import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SMAVO — Sistem Manajemen SMAN 2 Cibinong',
  description: 'Sistem informasi manajemen sekolah untuk pengelolaan aset, keuangan BOS, dan administrasi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={font.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
