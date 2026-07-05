"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Shapes, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/categories";
import {
  makeCategorySchema,
  type CategoryInput,
} from "@/lib/validations";
import { CATEGORY_COLORS, CATEGORY_ICONS, categoryIcon } from "@/lib/category-icons";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

export function CategoriesView({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    startTransition(async () => {
      const result = await deleteCategory(target.id);
      if (result.ok) toast.success(t("common.deleted"));
      else toast.error(t(result.error));
      setConfirmDelete(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden /> {t("categories.addCategory")}
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Shapes} title={t("transactions.emptyLedger")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = categoryIcon(category.icon);
            return (
              <Card key={category.id} className="group">
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${category.color}1a` }}
                  >
                    <Icon className="size-5" style={{ color: category.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {category.is_default
                        ? t(`defaultCategories.${category.name}`)
                        : category.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("categories.inUse", {
                        count: counts[category.id] ?? 0,
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        {t(
                          category.kind === "expense"
                            ? "categories.kindExpense"
                            : category.kind === "income"
                              ? "categories.kindIncome"
                              : "categories.kindBoth"
                        )}
                      </Badge>
                      {category.budget_limit ? (
                        <Badge variant="secondary" className="ledger-num">
                          <Money
                            amount={Number(category.budget_limit)}
                            currency="USD"
                          />
                          {t("common.perMonth")}
                        </Badge>
                      ) : null}
                      {category.is_default && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {t("categories.default")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${category.name} — ${t("common.edit")}`}
                      onClick={() => setEditing(category)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    {!category.is_default && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${category.name} — ${t("common.delete")}`}
                        onClick={() => setConfirmDelete(category)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <CategoryDialog
          category={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open: boolean) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("categories.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("categories.deleteBody", { name: confirmDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryDialog({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const t = useTranslations();
  const tv = useTranslations("validation");
  const router = useRouter();

  const schema = useMemo(() => makeCategorySchema((k) => tv(k)), [tv]);
  const form = useForm<CategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? {
          name: category.name,
          kind: category.kind,
          color: category.color,
          icon: category.icon,
          budget_limit: category.budget_limit,
        }
      : {
          name: "",
          kind: "expense",
          color: CATEGORY_COLORS[0],
          icon: "circle-dashed",
          budget_limit: null,
        },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = category
      ? await updateCategory(category.id, values)
      : await createCategory(values);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    toast.success(category ? t("common.updated") : t("common.added"));
    onClose();
    router.refresh();
  });

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {category ? t("categories.editCategory") : t("categories.addCategory")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categories.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("categories.kind")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">
                          {t("categories.kindExpense")}
                        </SelectItem>
                        <SelectItem value="income">
                          {t("categories.kindIncome")}
                        </SelectItem>
                        <SelectItem value="both">
                          {t("categories.kindBoth")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("categories.budgetLimit")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        className="ledger-num"
                        placeholder={t("categories.budgetLimitHint")}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : e.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categories.color")}</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        aria-pressed={field.value === color}
                        onClick={() => field.onChange(color)}
                        className={cn(
                          "size-7 rounded-full border-2 border-transparent transition-transform hover:scale-110",
                          field.value === color && "border-foreground"
                        )}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categories.icon")}</FormLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CATEGORY_ICONS).map(([slug, Icon]) => (
                      <button
                        key={slug}
                        type="button"
                        aria-label={slug}
                        aria-pressed={field.value === slug}
                        onClick={() => field.onChange(slug)}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-md border transition-colors hover:bg-muted",
                          field.value === slug &&
                            "border-primary bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
