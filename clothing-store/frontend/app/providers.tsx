// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { useState } from 'react';
import { Toaster } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// کامپوننت جدا برای Toaster که داخل ThemeProvider هست
function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  // تم معکوس: dark → light، light → dark
  const toasterTheme =
    resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <Toaster
      position="top-right"
      theme={toasterTheme}
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />,
        error: <XCircle className="w-5 h-5 text-rose-500" />,
        loading: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
        info: <Info className="w-5 h-5 text-sky-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      }}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: '!bg-card !text-card-foreground !border-border',
          title: '!text-card-foreground',
          description: '!text-muted-foreground',
        },
        style: {
          direction: 'rtl',
          gap: '15px',
        },
      }}
    />
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />      {/* ← داخل Provider */}
      </QueryClientProvider>
    </ThemeProvider>
  );
}