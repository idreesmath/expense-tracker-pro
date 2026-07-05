"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { createEntry, updateEntry } from "@/actions/ledger";
import { useAppData } from "@/components/app-context";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import {
  makeLedgerEntrySchema,
  MAX_RECEIPT_BYTES,
  RECEIPT_MIME_TYPES,
  type LedgerEntryInput,
} from "@/lib/validations";
import { categoryIcon } from "@/lib/category-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LedgerEntry, TransactionType } from "@/types/database";

/**
 * The one form for both ledgers: quick-add (FAB, palette, dashboard)
 * and edit (tables) all pass through here, so validation, currency
 * handling and receipt upload stay identical everywhere.
 */
export function EntryDialog({
  kind,
  record,
  open,
  onOpenChange,
}: {
  kind: TransactionType;
  record?: LedgerEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const t = useTranslations();
  const tv = useTranslations("validation");
  const { categories, paymentMethods, settings } = useAppData();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const schema = useMemo(() => makeLedgerEntrySchema((k) => tv(k)), [tv]);

  const form = useForm<LedgerEntryInput>({
    resolver: zodResolver(schema),
    defaultValues: record
      ? {
          amount: Number(record.amount),
          currency: record.currency,
          category_id: record.category_id,
          payment_method_id: record.payment_method_id,
          sub_category: record.sub_category ?? "",
          description: record.description,
          notes: record.notes ?? "",
          occurred_on: record.occurred_on,
          status: record.status,
        }
      : {
          amount: undefined,
          currency: settings.currency,
          category_id: null,
          payment_method_id:
            paymentMethods.find((m) => m.is_default)?.id ?? null,
          sub_category: "",
          description: "",
          notes: "",
          occurred_on: new Date().toISOString().slice(0, 10),
          status: "cleared",
        },
  });

  const relevantCategories = categories.filter(
    (c) => c.kind === kind || c.kind === "both"
  );

  const onPickFile = (picked: File | null) => {
    if (!picked) return setFile(null);
    if (!RECEIPT_MIME_TYPES.includes(picked.type)) {
      toast.error(tv("fileType"));
      return;
    }
    if (picked.size > MAX_RECEIPT_BYTES) {
      toast.error(tv("fileTooLarge"));
      return;
    }
    setFile(picked);
  };

  async function uploadReceipt(entryId: string) {
    if (!file) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const blob = await compressImage(file);
    const path = `${user.id}/${entryId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("receipts")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) return;

    await supabase.from("attachments").insert({
      user_id: user.id,
      expense_id: kind === "expense" ? entryId : null,
      income_id: kind === "income" ? entryId : null,
      storage_path: path,
      file_name: file.name,
      mime_type: "image/jpeg",
      size_bytes: blob.size,
    });
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      const result = record
        ? await updateEntry(kind, record.id, values)
        : await createEntry(kind, values);

      if (!result.ok) {
        toast.error(t(result.error));
        return;
      }
      const id = record?.id ?? (result.data as { id: string } | undefined)?.id;
      if (id && file) await uploadReceipt(id);

      toast.success(record ? t("common.updated") : t("common.added"));
      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  });

  const title = record
    ? t(kind === "expense" ? "expenses.editExpense" : "income.editIncome")
    : t(kind === "expense" ? "expenses.addExpense" : "income.addIncome");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>
            {t(kind === "expense" ? "expenses.subtitle" : "income.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="ledger-num text-lg"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.currency")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="ledger-num w-24">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="PKR">₨ PKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        kind === "expense"
                          ? "expenses.descriptionPlaceholder"
                          : "income.descriptionPlaceholder"
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.category")}</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relevantCategories.map((c) => {
                          const Icon = categoryIcon(c.icon);
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              <Icon
                                className="size-4"
                                style={{ color: c.color }}
                                aria-hidden
                              />
                              {c.is_default
                                ? t(`defaultCategories.${c.name}`)
                                : c.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sub_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("common.subCategory")}{" "}
                      <span className="text-muted-foreground">
                        ({t("common.optional")})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("expenses.subCategoryPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="occurred_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_method_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.paymentMethod")}</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["cleared", "pending", "scheduled"] as const).map(
                          (s) => (
                            <SelectItem key={s} value={s}>
                              {t(`statuses.${s}`)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel htmlFor="receipt-file">
                  {t("expenses.receiptUpload")}
                </FormLabel>
                <div className="relative">
                  <Input
                    id="receipt-file"
                    type="file"
                    accept={RECEIPT_MIME_TYPES.join(",")}
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                    className="pe-8"
                  />
                  <Paperclip
                    className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("expenses.receiptHint")}
                </p>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("common.notes")}{" "}
                    <span className="text-muted-foreground">
                      ({t("common.optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={t("expenses.notesPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.loading") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
