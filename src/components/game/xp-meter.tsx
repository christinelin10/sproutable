export function XpMeter({
  levelLabel,
  title,
  xpLabel,
  nextLabel,
  value,
  max,
}: {
  levelLabel: string;
  title: string;
  xpLabel: string;
  nextLabel: string;
  value: number;
  max: number;
}) {
  const pct = max <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="min-w-0 sm:min-w-64">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-game text-xl leading-none">{levelLabel}</p>
        <p className="text-sm font-semibold text-muted">{xpLabel}</p>
      </div>
      <p className="mt-1 font-game text-lg text-primary">{title}</p>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full border-2 border-[#3d2914] bg-[#efe4cf]"
        role="progressbar"
        aria-valuenow={max <= 0 ? value : value}
        aria-valuemin={0}
        aria-valuemax={max <= 0 ? value : max}
        aria-valuetext={nextLabel}
        aria-label={title}
      >
        <div className="h-full bg-[#3f7d4e]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-sm text-muted">{nextLabel}</p>
    </div>
  );
}
