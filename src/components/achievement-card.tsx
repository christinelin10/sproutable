import type { AchievementCategory } from "@/lib/achievements";

export function AchievementCard({
  title,
  requirement,
  category,
  count,
  target,
  progressLabel,
  statusLabel,
}: {
  title: string;
  requirement: string;
  category: AchievementCategory;
  count: number | null;
  target: number;
  progressLabel: string;
  statusLabel: string;
}) {
  const earned = count !== null && count >= target;
  const progress = Math.min(count ?? 0, target);

  return (
    <article className={`h-full rounded-2xl border bg-card p-5 shadow-sm ${earned ? "border-sun" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${earned ? "border-sun bg-sun/30 text-primary" : "border-line bg-background text-muted"}`}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            {category === "visits" ? (
              <>
                <path d="M12 20v-9M12 14C6 14 4 11 4 6c5 0 8 3 8 8ZM12 11c0-5 3-7 8-7 0 5-3 7-8 7ZM7 20h10" />
              </>
            ) : category === "harvests" ? (
              <>
                <path d="M4 11h16l-2 9H6l-2-9ZM7 11l5-7 5 7M9 14v3m6-3v3" />
                <path d="M12 7c0-4 3-5 6-4-1 3-3 4-6 4Z" />
              </>
            ) : (
              <>
                <path d="M8 6l1-2h6l1 2h4v14H4V6h4Z" />
                <circle cx="12" cy="13" r="4" />
                <path d="M10 15c0-4 1-5 4-4 0 3-1 4-4 4Z" />
              </>
            )}
          </svg>
        </span>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${earned ? "bg-sun/30 text-primary" : "bg-background text-muted"}`}>
          {earned ? <span aria-hidden="true">✓ </span> : null}{statusLabel}
        </span>
      </div>
      <h3 className={`mt-3 text-xl font-semibold ${earned ? "text-primary" : "text-foreground"}`}>{title}</h3>
      <p className="mt-1 text-sm text-muted">{requirement}</p>
      <p className="mt-3 text-muted">{progressLabel}</p>
      {count !== null ? (
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-background" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={target} aria-valuenow={progress} aria-valuetext={progressLabel}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${(progress / target) * 100}%` }} />
        </div>
      ) : null}
    </article>
  );
}
