export const BEECHVIEW_SLUG = "beechview-community-garden";

/** Season fund for compost, hoses, and lumber. A pledge is a note, not a charge. */
export const SEASON_FUND_GOAL_CENTS = 80_000;

export function formatDollars(cents: number, locale: string) {
  return new Intl.NumberFormat(locale === "es" ? "es" : "en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
