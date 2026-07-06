import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ChartNoAxesCombined,
  FileText,
  Landmark,
  Languages,
  ShieldCheck,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "@/components/layout/brand-mark";
import { LocaleSwitch } from "@/components/landing/locale-switch";
import { Button } from "@/components/ui/button";

/** Landing: the guilloché "banknote" hero is the brand's one loud moment. */
export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const features = [
    { icon: Target, title: t("featureBudgetsTitle"), body: t("featureBudgetsBody") },
    { icon: Landmark, title: t("featureCurrencyTitle"), body: t("featureCurrencyBody") },
    { icon: Languages, title: t("featureBilingualTitle"), body: t("featureBilingualBody") },
    { icon: FileText, title: t("featureReportsTitle"), body: t("featureReportsBody") },
    { icon: ChartNoAxesCombined, title: t("featureAnalyticsTitle"), body: t("featureAnalyticsBody") },
    { icon: ShieldCheck, title: t("featureSecureTitle"), body: t("featureSecureBody") },
  ];

  return (
    <div className="min-h-dvh bg-background">
      {/* ---- Hero: dark banknote panel ---- */}
      <div className="guilloche bg-sidebar text-sidebar-foreground">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark className="text-sidebar-primary" />
            <span className="text-sm font-semibold">{tc("appName")}</span>
          </div>
          <nav className="flex items-center gap-1.5">
            <LocaleSwitch className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">{t("openApp")}</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Link href="/login">{t("signIn")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("getStarted")}</Link>
                </Button>
              </>
            )}
          </nav>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sidebar-primary rtl:text-sm rtl:leading-loose rtl:tracking-normal">
            {t("heroEyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.15] sm:text-6xl sm:leading-[1.1] rtl:mt-6 rtl:leading-[1.9] sm:rtl:leading-[1.8]">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-sidebar-foreground/75 sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={user ? "/dashboard" : "/register"}>
                {t("heroCtaPrimary")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Link href={user ? "/dashboard" : "/login"}>
                {t("heroCtaSecondary")}
              </Link>
            </Button>
          </div>

          {/* Ledger strip: three facts, set like banknote denominations */}
          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-sidebar-border pt-6">
            {(
              [
                ["2", t("statCurrencies")],
                ["2", t("statLanguages")],
                ["4+", t("statCharts")],
              ] as const
            ).map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="ledger-num text-3xl font-medium text-sidebar-primary sm:text-4xl">
                  {value}
                </dd>
                <dd className="mt-1 text-xs text-sidebar-foreground/65 sm:text-sm">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ---- Features ---- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          {t("featuresTitle")}
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-card p-6">
              <feature.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-medium">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark className="size-6 text-primary" />
            <span>{tc("appName")}</span>
          </div>
          <p>{t("footerRights")}</p>
        </div>
      </footer>
    </div>
  );
}
