import { redirect } from "next/navigation";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("reports");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const today = new Date();
  const isDate = (v: unknown): v is string =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const from = isDate(sp.from) ? sp.from : format(startOfMonth(today), "yyyy-MM-dd");
  const to = isDate(sp.to) ? sp.to : format(endOfMonth(today), "yyyy-MM-dd");

  const { data: rows } = await supabase
    .from("transactions")
    .select("*")
    .gte("occurred_on", from)
    .lte("occurred_on", to)
    .order("occurred_on");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ReportsView rows={rows ?? []} from={from} to={to} />
    </div>
  );
}
