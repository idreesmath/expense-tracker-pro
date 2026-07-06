import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Gulzar,
  Instrument_Sans,
  Noto_Naskh_Arabic,
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

// Urdu body/UI text: Naskh stays legible at small sizes where Nastaliq doesn't.
const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
});

// Urdu display/headings: Gulzar's Nastaliq keeps the calligraphic identity.
const gulzar = Gulzar({
  variable: "--font-gulzar",
  subsets: ["arabic"],
  weight: "400",
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
        className={`${instrumentSans.variable} ${fraunces.variable} ${splineMono.variable} ${naskh.variable} ${gulzar.variable} min-h-full font-sans antialiased`}
      >
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <SwRegister />
      </body>
    </html>
  );
}
