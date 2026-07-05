import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MoneyProvider } from "@/components/money-context";
import { AppShell } from "@/components/layout/app-shell";
import type { RateMap } from "@/lib/currency";
import type { CurrencyCode } from "@/types/database";

/**
 * Protected area: resolves the signed-in user's profile, preferences,
 * reference data and unread notifications once, then provides them to
 * the client shell (sidebar, header, quick-add, command palette).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: settings },
    { data: currencies },
    { data: categories },
    { data: paymentMethods },
    { data: notifications },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("settings").select("*").eq("user_id", user.id).single(),
    supabase.from("currencies").select("*"),
    supabase.from("categories").select("*").eq("user_id", user.id).order("name"),
    supabase.from("payment_methods").select("*").eq("user_id", user.id).order("created_at"),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!profile || !settings) redirect("/login");

  const rates = Object.fromEntries(
    (currencies ?? []).map((c) => [c.code, Number(c.rate_to_usd)])
  ) as RateMap;

  return (
    <MoneyProvider display={settings.currency as CurrencyCode} rates={rates}>
      <AppShell
        profile={profile}
        settings={settings}
        email={user.email ?? ""}
        categories={categories ?? []}
        paymentMethods={paymentMethods ?? []}
        notifications={notifications ?? []}
      >
        {children}
      </AppShell>
    </MoneyProvider>
  );
}
