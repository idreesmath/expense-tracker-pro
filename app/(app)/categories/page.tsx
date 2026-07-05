import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CategoriesView } from "@/components/categories/categories-view";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const t = await getTranslations("categories");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: usage }] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", user.id).order("name"),
    supabase.from("transactions").select("category_id"),
  ]);

  const counts: Record<string, number> = {};
  for (const row of usage ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CategoriesView categories={categories ?? []} counts={counts} />
    </div>
  );
}
