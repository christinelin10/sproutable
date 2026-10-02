import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MapExplorer } from "@/app/map/map-explorer";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { HOME_BASE, NEARBY_GARDENS, milesBetween } from "@/lib/nearby-gardens";

export default async function MapPage() {
  const t = await getTranslations("map");
  const user = await getCurrentUser();
  const db = await readDb();
  const favoriteSlugs = new Set(
    user
      ? (db.gardenTies ?? [])
          .filter((tie) => tie.user_id === user.user_id && tie.kind === "favorite")
          .map((tie) => db.gardens.find((garden) => garden.garden_id === tie.garden_id)?.slug)
          .filter((slug): slug is string => Boolean(slug))
      : [],
  );
  const visitedSlugs = new Set(
    user
      ? db.visits
          .filter((visit) => visit.user_id === user.user_id)
          .map((visit) => db.gardens.find((garden) => garden.garden_id === visit.garden_id)?.slug)
          .filter((slug): slug is string => Boolean(slug))
      : [],
  );
  const gardens = NEARBY_GARDENS.map((garden) => ({
    ...garden,
    miles: milesBetween(HOME_BASE.lat, HOME_BASE.lng, garden.lat, garden.lng),
    favorite: Boolean(garden.slug && favoriteSlugs.has(garden.slug)),
    visited: Boolean(garden.slug && visitedSlugs.has(garden.slug)),
  })).sort((a, b) => a.miles - b.miles);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-semibold text-primary">
        <Link href="/" className="underline">
          {t("home")}
        </Link>
      </p>
      <h1 className="mt-2 font-game text-4xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t("body")}</p>
      <div className="mt-6 overflow-hidden rounded-[1.25rem] border-4 border-[#3d2914] shadow-[6px_6px_0_#3d2914]">
        <MapExplorer
          token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""}
          gardens={gardens}
          copy={{
            youAreHere: t("youAreHere"),
            startingPoint: t("startingPoint"),
            liveStart: t("liveStart"),
            liveWaiting: t("liveWaiting"),
            liveOn: t("liveOn"),
            liveCenter: t("liveCenter"),
            liveDenied: t("liveDenied"),
            liveUnavailable: t("liveUnavailable"),
            liveUnsupported: t("liveUnsupported"),
            fromYou: t("fromYou"),
            nearby: t("nearby"),
            miles: t("miles"),
            openGarden: t("openGarden"),
            openPin: t("openPin"),
            notOnSproutable: t("notOnSproutable"),
            missingToken: t("missingToken"),
            listLabel: t("listLabel"),
            mapLabel: t("mapLabel"),
            favorite: t("favorite"),
            visited: t("visited"),
          }}
        />
      </div>
    </section>
  );
}
