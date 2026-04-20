'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--card))',
              color: 'rgb(var(--foreground))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: 'rgb(var(--success))', secondary: 'rgb(var(--card))' } },
            error: { iconTheme: { primary: 'rgb(var(--danger))', secondary: 'rgb(var(--card))' } },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
