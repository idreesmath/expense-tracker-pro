"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, Search } from "lucide-react";
import { useAppData } from "@/components/app-context";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/database";

/** Sticky header: mobile nav, breadcrumb, palette trigger and toggles. */
export function Header({ notifications }: { notifications: AppNotification[] }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const tp = useTranslations("palette");
  const pathname = usePathname();
  const { openPalette } = useAppData();

  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.href));

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        {/* Mobile navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={tc("openMenu")}
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 bg-sidebar p-0 text-sidebar-foreground"
          >
            <SheetHeader className="border-b border-sidebar-border px-4 py-4">
              <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
                <BrandMark className="size-7 text-sidebar-primary" />
                {tc("appName")}
              </SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 p-2" aria-label={tc("menu")}>
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75"
                    )}
                  >
                    <item.icon className="size-4.5" aria-hidden />
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="hidden text-muted-foreground sm:block">
              <Link href="/dashboard" className="hover:text-foreground">
                {tc("appName")}
              </Link>
            </li>
            {current ? (
              <>
                <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                  /
                </li>
                <li className="truncate font-medium">{t(current.key)}</li>
              </>
            ) : null}
          </ol>
        </nav>

        {/* Palette trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={openPalette}
          className="hidden min-w-44 justify-between gap-3 text-muted-foreground md:flex"
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5" aria-hidden />
            {tc("search")}
          </span>
          <kbd className="ledger-num rounded border bg-muted px-1.5 py-0.5 text-[10px]">
            Ctrl K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={openPalette}
          className="md:hidden"
          aria-label={tp("placeholder")}
        >
          <Search className="size-5" aria-hidden />
        </Button>

        <CurrencyToggle />
        <LanguageToggle />
        <ThemeToggle />
        <NotificationsMenu initial={notifications} />
        <UserMenu />
      </div>
    </header>
  );
}
