import { getTranslations } from "next-intl/server";
import { Village } from "@/components/game/village";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const t = await getTranslations("village");
  const user = await getCurrentUser();
  return (
    <Village
      name={user?.name.split(" ")[0] || t("visitor")}
      guest={!user}
      caption={t("caption")}
      moveHint={t("move")}
      enterLabel={t("enter")}
      tourHref="/welcome"
      tourLabel={t("tour")}
      places={[
        { id: "map", href: "/map", label: t("map"), hint: t("mapHint"), x: 50, y: 18 },
        { id: "community", href: "/community", label: t("community"), hint: t("communityHint"), x: 18, y: 46 },
        { id: "growing", href: "/growing", label: t("growing"), hint: t("growingHint"), x: 82, y: 46 },
        { id: "achievements", href: "/achievements", label: t("achievements"), hint: t("achievementsHint"), x: 50, y: 74 },
      ]}
    />
  );
}
