"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { makeRegisterSchema } from "@/lib/validations";
import { signUp } from "@/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => makeRegisterSchema((k) => tv(k)), [tv]);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const result = await signUp(values);
    if (result && !result.ok) {
      setServerError(tc("error"));
      return;
    }
    if (result?.ok && result.data?.needsConfirmation) setSent(true);
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("checkEmailConfirm")}</p>
        <Button asChild variant="outline">
          <Link href="/login">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">
        {t("registerTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("registerSubtitle")}
      </p>

      <div className="mt-6 space-y-4">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {t("orContinueWith")}
          </span>
          <Separator className="flex-1" />
        </div>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fullName")}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {serverError && (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {t("signUp")}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
