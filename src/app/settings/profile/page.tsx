import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/profile");
  const { notice } = await searchParams;
  const t = await getTranslations("settings");
  return (
    <>
      {notice ? (
        <p role="status" className="mx-auto max-w-lg px-4 pt-6 font-semibold">
          {t("saveProfile")}
        </p>
      ) : null}
      <ProfileForm user={user} />
    </>
  );
}
