"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { makeForgotSchema } from "@/lib/validations";
import { forgotPassword } from "@/actions/auth";
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

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const [sent, setSent] = useState(false);

  const schema = useMemo(() => makeForgotSchema((k) => tv(k)), [tv]);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await forgotPassword(values);
    setSent(true);
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("resetSent")}</p>
        <Button asChild variant="outline">
          <Link href="/login">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{t("forgotTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("forgotSubtitle")}</p>

      <Form {...form}>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
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
            {t("sendResetLink")}
          </Button>
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("signIn")}
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
