import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pokerpot-zeta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pokerpot — Settle the table.",
    template: "%s · Pokerpot",
  },
  description:
    "Track buy-ins, collect cash-outs from friends, and let Pokerpot calculate who pays whom — in the fewest transactions possible.",
  keywords: [
    "poker",
    "chip calculator",
    "settle up",
    "buy-in tracker",
    "home game",
    "split bill",
    "cash game",
  ],
  applicationName: "Pokerpot",
  authors: [{ name: "Pokerpot" }],
  appleWebApp: {
    capable: true,
    title: "Pokerpot",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "Pokerpot",
    title: "Pokerpot — Settle the table.",
    description:
      "Track buy-ins, collect cash-outs from friends, and let Pokerpot calculate who pays whom.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokerpot — Settle the table.",
    description:
      "Track buy-ins, collect cash-outs from friends, and let Pokerpot calculate who pays whom.",
  },
};

export const viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
