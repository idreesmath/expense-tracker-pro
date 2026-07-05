"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/components/app-context";
import { StatCards } from "@/components/dashboard/stat-cards";
import { MonthlyOverviewChart, WeeklyOverviewChart, CategoryDonut } from "@/components/dashboard/charts";
import {
  BudgetProgressCard,
  GoalsCard,
  MiniCalendarCard,
  QuickAddCard,
  RecentTransactionsCard,
  TopCategoriesCard,
  UpcomingBillsCard,
} from "@/components/dashboard/widgets";
import type { MoneyBag } from "@/lib/aggregate";
import type {
  AppNotification,
  Budget,
  Goal,
  RecurringRule,
  Transaction,
} from "@/types/database";

export interface DashboardData {
  totals: {
    income: MoneyBag;
    expense: MoneyBag;
    monthIncome: MoneyBag;
    monthExpense: MoneyBag;
  };
  months: Array<{ month: string; income: MoneyBag; expense: MoneyBag }>;
  week: Array<{ day: string; expense: MoneyBag }>;
  categorySpend: Array<{ categoryId: string; bag: MoneyBag }>;
  budgets: Budget[];
  budgetSpend: Record<string, MoneyBag>;
  recent: Transaction[];
  bills: RecurringRule[];
  goals: Goal[];
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    is_default: boolean;
  }>;
  calendar: Record<string, MoneyBag>;
  /** present for typing parity; notifications render in the header */
  notifications?: AppNotification[];
}

/** The premium overview: 12-column ledger of animated widgets. */
export function DashboardView({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard");
  const { profile } = useAppData();
  const firstName = (profile.full_name ?? "").split(" ")[0] || "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("welcome", { name: firstName })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("welcomeSubtitle")}
        </p>
      </div>

      <StatCards totals={data.totals} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MonthlyOverviewChart months={data.months} className="lg:col-span-2" />
        <CategoryDonut
          categorySpend={data.categorySpend}
          categories={data.categories}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentTransactionsCard
          recent={data.recent}
          categories={data.categories}
          className="lg:col-span-2"
        />
        <div className="space-y-4">
          <QuickAddCard />
          <BudgetProgressCard budgets={data.budgets} spend={data.budgetSpend} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WeeklyOverviewChart week={data.week} />
        <UpcomingBillsCard bills={data.bills} />
        <TopCategoriesCard
          categorySpend={data.categorySpend}
          categories={data.categories}
        />
        <div className="space-y-4">
          <MiniCalendarCard calendar={data.calendar} />
        </div>
      </div>

      <GoalsCard goals={data.goals} />
    </div>
  );
}
