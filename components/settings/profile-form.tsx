"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { z } from "zod";
import { changePassword, updateAvatar, updateProfile } from "@/actions/settings";
import { useAppData } from "@/components/app-context";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { makeProfileSchema, makeResetSchema } from "@/lib/validations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/** Profile identity, photo and password — used by Settings and /profile. */
export function ProfileForm() {
  const t = useTranslations();
  const tv = useTranslations("validation");
  const router = useRouter();
  const { profile, email } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const nameSchema = useMemo(() => makeProfileSchema((k) => tv(k)), [tv]);
  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { full_name: profile.full_name ?? "" },
  });

  const passwordSchema = useMemo(() => makeResetSchema((k) => tv(k)), [tv]);
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const initials = (profile.full_name ?? email).slice(0, 2).toUpperCase();

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const blob = await compressImage(file, { maxDimension: 400, quality: 0.85 });
      const path = `${profile.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const result = await updateAvatar(data.publicUrl);
      if (!result.ok) throw new Error(result.error);
      toast.success(t("common.updated"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.tabProfile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Camera aria-hidden /> {t("settings.changePhoto")}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <Form {...nameForm}>
            <form
              className="space-y-4"
              onSubmit={nameForm.handleSubmit(async (values) => {
                const result = await updateProfile(values);
                if (result.ok) {
                  toast.success(t("common.saved"));
                  router.refresh();
                } else toast.error(t(result.error));
              })}
            >
              <FormField
                control={nameForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.displayName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="profile-email">{t("auth.email")}</Label>
                <Input id="profile-email" value={email} disabled />
                <p className="text-xs text-muted-foreground">
                  {t("settings.emailReadonly")}
                </p>
              </div>
              <Button type="submit" disabled={nameForm.formState.isSubmitting}>
                {t("common.save")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("settings.changePassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit(async (values) => {
                const result = await changePassword(values);
                if (result.ok) {
                  toast.success(t("auth.passwordUpdated"));
                  passwordForm.reset();
                } else toast.error(t(result.error));
              })}
            >
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.newPassword")}</FormLabel>
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
                control={passwordForm.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPassword")}</FormLabel>
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
              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
              >
                {t("auth.updatePassword")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
