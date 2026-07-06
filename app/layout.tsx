import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Instrument_Sans,
  Spline_Sans_Mono,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { dirFor } from "@/i18n/config";
import { Providers } from "@/components/providers";
import { SwRegister } from "@/components/sw-register";
import type { Locale } from "@/types/database";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Expense Tracker Pro — every rupee and dollar, accounted for",
    template: "%s · Expense Tracker Pro",
  },
  description:
    "Multi-currency (USD/PKR), bilingual (English/Urdu) expense tracking with budgets, analytics and exportable reports.",
  applicationName: "Expense Tracker Pro",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1411" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = (await getLocale()) as Locale;

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${fraunces.variable} ${splineMono.variable} min-h-full font-sans antialiased`}
      >
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <SwRegister />
      </body>
    </html>
  );
}
