import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileDock } from "@/components/layout/MobileDock";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AuthModal } from "@/components/layout/AuthModal";
import { SearchModal } from "@/components/layout/SearchModal";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fetchflix — Free Movies & TV Shows Streaming",
    template: "%s · Fetchflix",
  },
  description:
    "Watch the latest movies, TV series, 4K content, and live sports in HD on Fetchflix. Free streaming with no ads.",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <AuthProvider>
          <SearchProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>

            <main className="flex-1">{children}</main>
            <Footer />
            <MobileDock />
            <ScrollToTop />
            <AuthModal />
            <SearchModal />
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
