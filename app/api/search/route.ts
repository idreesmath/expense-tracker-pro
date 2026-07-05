import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Global search over the unified transactions view: description, notes,
 * sub-category, amount (numeric queries) and date (ISO fragments).
 * RLS scopes results to the caller.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json([]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const like = `%${q.replaceAll("%", "").replaceAll(",", "")}%`;
  const filters = [
    `description.ilike.${like}`,
    `notes.ilike.${like}`,
    `sub_category.ilike.${like}`,
  ];
  if (/^\d{4}-\d{2}/.test(q)) filters.push(`occurred_on.gte.${q.slice(0, 10)}`);

  const numeric = Number(q);
  if (Number.isFinite(numeric) && numeric > 0) {
    filters.push(`amount.eq.${numeric}`);
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(filters.join(","))
    .order("occurred_on", { ascending: false })
    .limit(8);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
