import type { Metadata } from "next";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";
//import "@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
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
          <Suspense
            fallback={<div className="h-[76px] border-b border-border/70" />}
          >
            <Header />
          </Suspense>
          <main className="min-h-[70vh]">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
