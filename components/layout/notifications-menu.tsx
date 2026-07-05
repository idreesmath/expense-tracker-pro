"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing, CheckCheck, Target, CalendarClock } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/misc";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/database";

const TYPE_ICONS = {
  budget_alert: Target,
  payment_reminder: CalendarClock,
  monthly_summary: CalendarClock,
  daily_reminder: BellRing,
  system: Bell,
} as const;

export function NotificationsMenu({ initial }: { initial: AppNotification[] }) {
  const t = useTranslations("notifications");
  const [pending, startTransition] = useTransition();
  const unread = initial.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${t("title")}${unread ? ` (${unread})` : ""}`}
          className="relative"
        >
          <Bell className="size-4.5" aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute end-1.5 top-1.5 size-2 rounded-full bg-destructive"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">{t("title")}</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markAllNotificationsRead();
                })
              }
            >
              <CheckCheck aria-hidden /> {t("markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {initial.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ul>
              {initial.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <li key={n.id} className="ledger-rule last:border-b-0">
                    <button
                      type="button"
                      disabled={n.read || pending}
                      onClick={() =>
                        startTransition(async () => {
                          await markNotificationRead(n.id);
                        })
                      }
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60",
                        n.read && "opacity-60"
                      )}
                    >
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-snug">
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                      {!n.read && (
                        <span
                          aria-hidden
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
