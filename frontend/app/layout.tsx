import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import Preloader from "@/components/ui/Preloader";

export const metadata: Metadata = {
  title: "Baran — لباس برای زندگی واقعی",
  description:
    "فروشگاه آنلاین استریت‌ویر باران؛ طراحی‌شده در ایران برای هر جای دنیا.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Preloader />
        <Providers>
          <SiteChrome />
          <main className="min-h-[70vh]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
