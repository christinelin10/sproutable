import { getTranslations } from "next-intl/server";
import { WelcomeTour } from "@/components/game/welcome-tour";

export default async function WelcomePage() {
  const t = await getTranslations("welcome");
  return (
    <WelcomeTour
      title={t("title")}
      intro={t("intro")}
      idea={t("idea")}
      areas={[
        { title: t("communityTitle"), body: t("communityBody") },
        { title: t("growingTitle"), body: t("growingBody") },
        { title: t("mapTitle"), body: t("mapBody") },
        { title: t("achievementsTitle"), body: t("achievementsBody") },
      ]}
      buddiesTitle={t("buddiesTitle")}
      buddiesBody={t("buddiesBody")}
      nextLabel={t("next")}
      startLabel={t("start")}
      skipLabel={t("skip")}
    />
  );
}
