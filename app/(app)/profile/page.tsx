import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const t = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <PageHeader title={t("profile")} />
      <ProfileForm />
    </div>
  );
}
