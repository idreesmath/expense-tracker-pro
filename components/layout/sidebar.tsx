"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Desktop sidebar: a deep-pine panel that anchors both themes. */
export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-4 py-5", collapsed && "justify-center px-2")}>
        <BrandMark className="text-sidebar-primary" />
        {!collapsed && (
          <div className="min-w-0 rtl:pb-1 rtl:pt-3">
            <p className="truncate text-sm font-semibold leading-tight rtl:pt-1 rtl:leading-[2.4]">
              {tc("appName")}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60 rtl:leading-[2.4]">
              {tc("tagline")}
            </p>
          </div>
        )}
      </div>

      <nav aria-label={tc("menu")} className="flex-1 space-y-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="size-4.5 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{t(item.key)}</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{t(item.key)}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={collapsed ? t("expand") : t("collapse")}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4.5 rtl:-scale-x-100" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4.5 rtl:-scale-x-100" aria-hidden />
              <span>{t("collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
