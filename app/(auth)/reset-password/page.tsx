"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { makeResetSchema } from "@/lib/validations";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Arrived at from the password-reset email (the auth callback exchanges
 * the code first, so the user holds a recovery session here).
 */
export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const router = useRouter();

  const schema = useMemo(() => makeResetSchema((k) => tv(k)), [tv]);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await resetPassword(values);
    if (!result.ok) {
      toast.error(tc("error"));
      return;
    }
    toast.success(t("passwordUpdated"));
    router.push("/dashboard");
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{t("resetTitle")}</h1>

      <Form {...form}>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("newPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirmPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {t("updatePassword")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
