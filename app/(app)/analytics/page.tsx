import { redirect } from "next/navigation";
import { format, subYears } from "date-fns";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fiveYearsAgo = format(subYears(new Date(), 5), "yyyy-MM-dd");
  const { data: rows } = await supabase
    .from("transactions")
    .select("type, amount, currency, occurred_on, category_id")
    .gte("occurred_on", fiveYearsAgo)
    .order("occurred_on");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AnalyticsView rows={rows ?? []} />
    </div>
  );
}
