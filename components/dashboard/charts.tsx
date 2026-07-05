"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMoney } from "@/components/money-context";
import { bagTotal, type MoneyBag } from "@/lib/aggregate";
import { formatMonth } from "@/lib/format";
import { AXIS_PROPS, GRID_PROPS, ChartTip } from "@/components/charts/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/types/database";

/** Monthly income vs expense — the entity pair keeps its colors always. */
export function MonthlyOverviewChart({
  months,
  className,
}: {
  months: Array<{ month: string; income: MoneyBag; expense: MoneyBag }>;
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const { toDisplay, fmtDisplay } = useMoney();

  const data = useMemo(
    () =>
      months.map((m) => ({
        label: formatMonth(`${m.month}-01`, locale),
        income: bagTotal(m.income, toDisplay),
        expense: bagTotal(m.expense, toDisplay),
      })),
    [months, toDisplay, locale]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{t("monthlyOverview")}</CardTitle>
      </CardHeader>
      <CardContent dir="ltr" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
            <Bar
              dataKey="income"
              name={tc("income")}
              fill="var(--income)"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="expense"
              name={tc("expense")}
              fill="var(--expense)"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/** Last 7 days of spending — one series, no legend needed. */
export function WeeklyOverviewChart({
  week,
  className,
}: {
  week: Array<{ day: string; expense: MoneyBag }>;
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const { toDisplay, fmtDisplay } = useMoney();

  const data = useMemo(
    () =>
      week.map((d) => ({
        label: new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-US", {
          weekday: "short",
        }).format(new Date(`${d.day}T00:00:00`)),
        expense: bagTotal(d.expense, toDisplay),
      })),
    [week, toDisplay, locale]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{t("weeklyOverview")}</CardTitle>
      </CardHeader>
      <CardContent dir="ltr" className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" {...AXIS_PROPS} interval={0} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={<ChartTip format={(v) => fmtDisplay(v)} />}
            />
            <Bar
              dataKey="expense"
              name={t("thisMonthSpend")}
              fill="var(--expense)"
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const DONUT_SLOTS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

/** Category share of this month's spend: top 6 slices + Other. */
export function CategoryDonut({
  categorySpend,
  categories,
  className,
}: {
  categorySpend: Array<{ categoryId: string; bag: MoneyBag }>;
  categories: Array<{ id: string; name: string; is_default: boolean }>;
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const tdc = useTranslations("defaultCategories");
  const ta = useTranslations("analytics");
  const { toDisplay, fmtDisplay } = useMoney();

  const data = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const rows = categorySpend
      .map((entry) => {
        const category = byId.get(entry.categoryId);
        const name = category
          ? category.is_default
            ? tdc(category.name)
            : category.name
          : tdc("Other");
        return { name, value: bagTotal(entry.bag, toDisplay) };
      })
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);

    if (rows.length <= 6) return rows;
    const top = rows.slice(0, 6);
    const other = rows.slice(6).reduce((acc, r) => acc + r.value, 0);
    return [...top, { name: tdc("Other"), value: other, isOther: true }];
  }, [categorySpend, categories, toDisplay, tdc]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{t("byCategory")}</CardTitle>
      </CardHeader>
      <CardContent dir="ltr" className="h-72">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {ta("noData")}
          </p>
        ) : (
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
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      "isOther" in entry && entry.isOther
                        ? "var(--chart-other)"
                        : DONUT_SLOTS[index % DONUT_SLOTS.length]
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
