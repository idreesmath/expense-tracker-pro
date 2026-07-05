"use client";

import { useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMoney } from "@/components/money-context";
import { useAppData } from "@/components/app-context";
import { AXIS_PROPS, GRID_PROPS, ChartTip } from "@/components/charts/common";
import { exportChartPng } from "@/lib/chart-export";
import { formatMonth } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CurrencyCode, Locale, TransactionType } from "@/types/database";

interface Row {
  type: TransactionType | string;
  amount: number | string;
  currency: CurrencyCode;
  occurred_on: string;
  category_id: string | null;
}

type Period = "daily" | "weekly" | "monthly" | "yearly";
const PERIODS: Period[] = ["daily", "weekly", "monthly", "yearly"];

/** Bucket key + label for each period granularity. */
function bucketOf(dateIso: string, period: Period): string {
  if (period === "daily") return dateIso;
  if (period === "monthly") return dateIso.slice(0, 7);
  if (period === "yearly") return dateIso.slice(0, 4);
  // weekly: snap to Monday
  const date = new Date(`${dateIso}T00:00:00`);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

const BUCKET_LIMIT: Record<Period, number> = {
  daily: 30,
  weekly: 12,
  monthly: 12,
  yearly: 5,
};

export function AnalyticsView({ rows }: { rows: Row[] }) {
  const t = useTranslations("analytics");
  const tc = useTranslations("common");
  const tdc = useTranslations("defaultCategories");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toDisplay, fmtDisplay } = useMoney();
  const { categories } = useAppData();

  const period = (searchParams.get("period") as Period) || "monthly";
  const activePeriod: Period = PERIODS.includes(period) ? period : "monthly";

  const { series, categoryData } = useMemo(() => {
    const buckets = new Map<string, { income: number; expense: number }>();
    const byCategory = new Map<string, number>();
    const categoriesById = new Map(categories.map((c) => [c.id, c]));

    for (const row of rows) {
      const key = bucketOf(row.occurred_on, activePeriod);
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
      const value = toDisplay(Number(row.amount), row.currency);
      if (row.type === "income") bucket.income += value;
      else bucket.expense += value;
      buckets.set(key, bucket);
    }

    const keys = [...buckets.keys()].sort().slice(-BUCKET_LIMIT[activePeriod]);
    const keySet = new Set(keys);
    const nets = keys.map((key) => {
      const bucket = buckets.get(key)!;
      return bucket.income - bucket.expense;
    });
    const series = keys.map((key, index) => {
      const bucket = buckets.get(key)!;
      const running = nets
        .slice(0, index + 1)
        .reduce((acc, net) => acc + net, 0);
      return {
        label:
          activePeriod === "monthly"
            ? formatMonth(`${key}-01`, locale)
            : activePeriod === "yearly"
              ? key
              : key.slice(5),
        income: Math.round(bucket.income * 100) / 100,
        expense: Math.round(bucket.expense * 100) / 100,
        net: Math.round((bucket.income - bucket.expense) * 100) / 100,
        savings: Math.round(running * 100) / 100,
      };
    });

    // Category share within the visible window (expenses only)
    for (const row of rows) {
      if (row.type !== "expense") continue;
      if (!keySet.has(bucketOf(row.occurred_on, activePeriod))) continue;
      const category = row.category_id
        ? categoriesById.get(row.category_id)
        : undefined;
      const name = category
        ? category.is_default
          ? tdc(category.name)
          : category.name
        : tdc("Other");
      byCategory.set(
        name,
        (byCategory.get(name) ?? 0) + toDisplay(Number(row.amount), row.currency)
      );
    }
    const sorted = [...byCategory.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
    const categoryData =
      sorted.length > 6
        ? [
            ...sorted.slice(0, 6),
            {
              name: tdc("Other"),
              value: sorted.slice(6).reduce((acc, r) => acc + r.value, 0),
              isOther: true,
            },
          ]
        : sorted;

    return { series, categoryData };
  }, [rows, activePeriod, toDisplay, categories, tdc, locale]);

  return (
    <div className="space-y-4">
      <Tabs
        value={activePeriod}
        onValueChange={(value: string) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("period", value);
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }}
      >
        <TabsList>
          {PERIODS.map((p) => (
            <TabsTrigger key={p} value={p}>
              {t(p)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {series.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t("noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ExportableCard title={t("incomeVsExpense")} fileName="income-vs-expense">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} barGap={2} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="label" {...AXIS_PROPS} />
                <YAxis
                  {...AXIS_PROPS}
                  width={54}
                  tickFormatter={(v: number) => fmtDisplay(v, { compact: true })}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={<ChartTip format={(v) => fmtDisplay(v)} />}
                />
                <Legend
                  iconType="square"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
                <Bar dataKey="income" name={tc("income")} fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="expense" name={tc("expense")} fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ExportableCard>

          <ExportableCard title={t("savingsTrend")} fileName="savings-trend">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--income)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--income)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="label" {...AXIS_PROPS} />
                <YAxis
                  {...AXIS_PROPS}
                  width={54}
                  tickFormatter={(v: number) => fmtDisplay(v, { compact: true })}
                />
                <Tooltip content={<ChartTip format={(v) => fmtDisplay(v)} />} />
                <Area
                  type="monotone"
                  dataKey="savings"
                  name={tc("savings")}
                  stroke="var(--income)"
                  strokeWidth={2}
                  fill="url(#savingsFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ExportableCard>

          <ExportableCard title={t("spendTrend")} fileName="spend-trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="label" {...AXIS_PROPS} />
                <YAxis
                  {...AXIS_PROPS}
                  width={54}
                  tickFormatter={(v: number) => fmtDisplay(v, { compact: true })}
                />
                <Tooltip content={<ChartTip format={(v) => fmtDisplay(v)} />} />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name={tc("expenses")}
                  stroke="var(--expense)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ExportableCard>

          <ExportableCard title={t("categoryBreakdown")} fileName="category-breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTip format={(v) => fmtDisplay(v)} />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="square"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        "isOther" in entry && entry.isOther
                          ? "var(--chart-other)"
                          : `var(--chart-${(index % 6) + 1})`
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ExportableCard>
        </div>
      )}
    </div>
  );
}

/** Chart card with a PNG export control. */
function ExportableCard({
  title,
  fileName,
  children,
}: {
  title: string;
  fileName: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("analytics");
  const tc = useTranslations("common");
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${title} — ${t("exportChart")}`}
          onClick={async () => {
            if (!ref.current) return;
            const ok = await exportChartPng(ref.current, fileName);
            if (!ok) toast.error(tc("error"));
          }}
        >
          <Download aria-hidden /> {t("exportChart")}
        </Button>
      </CardHeader>
      <CardContent ref={ref} dir="ltr" className="h-72">
        {children}
      </CardContent>
    </Card>
  );
}
