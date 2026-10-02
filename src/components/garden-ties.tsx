import { setGardenTie } from "@/server/social-actions";

export function GardenTies({
  gardenId,
  next,
  loggedIn,
  loginHref,
  favorite,
  committed,
  volunteering,
  favoriteLabel,
  favoritedLabel,
  commitLabel,
  committedLabel,
  volunteerLabel,
  volunteeringLabel,
}: {
  gardenId: string;
  next: string;
  loggedIn: boolean;
  loginHref: string;
  favorite: boolean;
  committed: boolean;
  volunteering: boolean;
  favoriteLabel: string;
  favoritedLabel: string;
  commitLabel: string;
  committedLabel: string;
  volunteerLabel: string;
  volunteeringLabel: string;
}) {
  if (!loggedIn) {
    return (
      <div className="flex flex-wrap gap-2">
        {[favoriteLabel, commitLabel, volunteerLabel].map((label) => (
          <a key={label} href={loginHref} className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 font-semibold">
            {label}
          </a>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <form action={setGardenTie}>
        <input type="hidden" name="garden_id" value={gardenId} />
        <input type="hidden" name="kind" value="favorite" />
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={`min-h-11 rounded-full px-4 font-semibold ${favorite ? "bg-sun text-[#3d2914]" : "border border-line bg-card"}`}>
          {favorite ? favoritedLabel : favoriteLabel}
        </button>
      </form>
      <form action={setGardenTie}>
        <input type="hidden" name="garden_id" value={gardenId} />
        <input type="hidden" name="kind" value="gardener" />
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={`min-h-11 rounded-full px-4 font-semibold ${committed ? "bg-primary text-primary-foreground" : "border border-line bg-card"}`}>
          {committed ? committedLabel : commitLabel}
        </button>
      </form>
      <form action={setGardenTie}>
        <input type="hidden" name="garden_id" value={gardenId} />
        <input type="hidden" name="kind" value="volunteer" />
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={`min-h-11 rounded-full px-4 font-semibold ${volunteering ? "bg-[#3f8f55] text-white" : "border border-line bg-card"}`}>
          {volunteering ? volunteeringLabel : volunteerLabel}
        </button>
      </form>
    </div>
  );
}
