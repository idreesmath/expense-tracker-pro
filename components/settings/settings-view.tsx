"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Download, FileUp, Trash2 } from "lucide-react";
import { updateSettings } from "@/actions/settings";
import { deleteAccount, importExpensesCsv } from "@/actions/misc";
import { useAppData } from "@/components/app-context";
import { ProfileForm } from "@/components/settings/profile-form";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLog, CurrencyCode, Locale, ThemePreference } from "@/types/database";

export function SettingsView({ activity }: { activity: AuditLog[] }) {
  const t = useTranslations("settings");
  return (
    <Tabs defaultValue="profile" className="gap-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="profile">{t("tabProfile")}</TabsTrigger>
        <TabsTrigger value="preferences">{t("tabPreferences")}</TabsTrigger>
        <TabsTrigger value="notifications">{t("tabNotifications")}</TabsTrigger>
        <TabsTrigger value="data">{t("tabData")}</TabsTrigger>
        <TabsTrigger value="activity">{t("tabActivity")}</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileForm />
      </TabsContent>
      <TabsContent value="preferences">
        <PreferencesTab />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
      <TabsContent value="data">
        <DataTab />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab activity={activity} />
      </TabsContent>
    </Tabs>
  );
}

// ------------------------------------------------------------ preferences

function PreferencesTab() {
  const t = useTranslations("settings");
  const locale = useLocale() as Locale;
  const { settings } = useAppData();
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  const save = (patch: Parameters<typeof updateSettings>[0]) =>
    startTransition(async () => {
      const result = await updateSettings(patch);
      if (!result.ok) toast.error(t("tabPreferences"));
    });

  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-1.5">
          <Label>{t("language")}</Label>
          <Select
            value={locale}
            onValueChange={(v) => save({ locale: v as Locale })}
            disabled={pending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("english")}</SelectItem>
              <SelectItem value="ur">{t("urdu")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>{t("displayCurrency")}</Label>
          <Select
            value={settings.currency}
            onValueChange={(v) => save({ currency: v as CurrencyCode })}
            disabled={pending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">$ US Dollar</SelectItem>
              <SelectItem value="PKR">₨ Pakistani Rupee</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("displayCurrencyHint")}
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label>{t("theme")}</Label>
          <Select
            value={theme ?? "system"}
            onValueChange={(v) => {
              setTheme(v);
              save({ theme: v as ThemePreference });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("themeLight")}</SelectItem>
              <SelectItem value="dark">{t("themeDark")}</SelectItem>
              <SelectItem value="system">{t("themeSystem")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------ notifications

function NotificationsTab() {
  const t = useTranslations("settings");
  const { settings } = useAppData();
  const [pending, startTransition] = useTransition();

  const rows = [
    { key: "notify_budget_alerts", label: t("notifyBudget"), hint: t("notifyBudgetHint"), value: settings.notify_budget_alerts },
    { key: "notify_monthly_summary", label: t("notifyMonthly"), hint: t("notifyMonthlyHint"), value: settings.notify_monthly_summary },
    { key: "notify_payment_reminders", label: t("notifyPayments"), hint: t("notifyPaymentsHint"), value: settings.notify_payment_reminders },
    { key: "notify_daily_reminder", label: t("notifyDaily"), hint: t("notifyDailyHint"), value: settings.notify_daily_reminder },
  ] as const;

  return (
    <Card className="max-w-xl">
      <CardContent className="divide-y p-0">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 p-5">
            <div>
              <Label htmlFor={row.key}>{row.label}</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.hint}</p>
            </div>
            <Switch
              id={row.key}
              defaultChecked={row.value}
              disabled={pending}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  await updateSettings({ [row.key]: checked });
                })
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------ data

/** Minimal CSV line parser that respects double quotes. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function DataTab() {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  const onImport = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      toast.error(t("common.error"));
      return;
    }
    const header = parseCsvLine(lines[0].toLowerCase());
    const col = (name: string) => header.indexOf(name);
    const rows = lines.slice(1).map(parseCsvLine).map((cells) => ({
      occurred_on: cells[col("date")] ?? "",
      description: cells[col("description")] ?? "",
      amount: Number(cells[col("amount")] ?? 0),
      currency: (cells[col("currency")] ?? "USD").toUpperCase(),
      category: col("category") >= 0 ? cells[col("category")] : undefined,
    }));

    startTransition(async () => {
      const result = await importExpensesCsv(rows);
      if (result.ok && result.data) {
        toast.success(
          t("settings.importSuccess", { count: result.data.count })
        );
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  return (
    <div className="grid max-w-xl gap-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">{t("settings.exportData")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("settings.exportDataHint")}
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/api/export" download>
              <Download aria-hidden /> {t("common.download")}
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">{t("settings.importCsv")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("settings.importCsvHint")}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp aria-hidden /> {t("common.import")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onImport(e.target.files?.[0] ?? null)}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium text-destructive">
              {t("settings.deleteAccount")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("settings.deleteAccountHint")}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 aria-hidden /> {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.deleteAccount")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.deleteAccountHint")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-1.5">
                <Label htmlFor="delete-confirm">
                  {t("settings.deleteAccountConfirm")}
                </Label>
                <Input
                  id="delete-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={confirmText !== "DELETE" || pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteAccount();
                      if (result && !result.ok) toast.error(t("common.error"));
                    })
                  }
                >
                  {t("common.delete")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------ activity

function ActivityTab({ activity }: { activity: AuditLog[] }) {
  const t = useTranslations("settings");

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">{t("tabActivity")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("activityHint")}</p>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("activityEmpty")}
          </p>
        ) : (
          <ul>
            {activity.map((log) => (
              <li
                key={log.id}
                className="ledger-rule flex items-center gap-3 py-2.5 text-sm last:border-b-0"
              >
                <Badge
                  variant={log.action === "delete" ? "destructive" : "secondary"}
                  className="w-16 justify-center"
                >
                  {log.action}
                </Badge>
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {log.entity}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
