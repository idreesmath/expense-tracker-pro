import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/layout/brand-mark";

/** Auth screens: a single card on the deep-pine, guilloché-etched panel. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="guilloche flex min-h-dvh flex-col items-center justify-center bg-sidebar px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-3 text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <BrandMark className="size-10 text-sidebar-primary" />
        <span>
          <span className="block font-display text-lg font-semibold leading-tight">
            {t("appName")}
          </span>
          <span className="block text-xs text-sidebar-foreground/60">
            {t("tagline")}
          </span>
        </span>
      </Link>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow-xl sm:p-8">
        {children}
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-sidebar-foreground/60">
        {t("demoCredentials")}
      </p>
    </div>
  );
}
