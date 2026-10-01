"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { LocaleProvider } from "@/contexts/LocaleProvider";
import { CartProvider } from "@/contexts/CartProvider";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-rose-500" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
        info: <Info className="h-5 w-5 text-sky-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      }}
      toastOptions={{
        duration: 3500,
        classNames: {
          toast: "!border-border !bg-card !text-card-foreground",
          title: "!text-card-foreground",
          description: "!text-muted-foreground",
        },
        style: { direction: "rtl", gap: "15px" },
      }}
    />
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            {children}
            <ThemedToaster />
          </CartProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
