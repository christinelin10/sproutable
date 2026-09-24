import type { Garden, HomeModule, Involvement } from "@/lib/types";

export function defaultModules(garden: Garden, ids: () => string): HomeModule[] {
  const base = {
    garden_id: garden.garden_id,
    visible: true,
    title_en: "",
    title_es: "",
    body_en: "",
    body_es: "",
    config: {} as Record<string, unknown>,
  };
  const types: HomeModule["type"][] = ["hero", "about", "upcoming_events", "ways", "getting_here", "contact"];
  return types.map((type, index) => ({
    ...base,
    module_id: ids(),
    type,
    position: index,
    title_en: type === "hero" ? garden.name : "",
    body_en: type === "about" ? garden.description_en : "",
    body_es: type === "about" ? garden.description_es : "",
    config:
      type === "getting_here"
        ? { bus_en: "", bus_es: "", parking_en: "", parking_es: "", access_en: "", access_es: "" }
        : type === "ways"
          ? { options: garden.involvement_options.split(",").filter(Boolean) }
          : {},
  }));
}

export const INVOLVEMENT: Involvement[] = ["bed", "volunteer", "events", "produce", "learn"];
