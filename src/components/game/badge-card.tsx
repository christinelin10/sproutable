export function BadgeCard({
  name,
  detail,
  earned,
  status,
}: {
  name: string;
  detail: string;
  earned: boolean;
  status: string;
}) {
  return (
    <article className={`game-panel h-full p-4 ${earned ? "bg-[#fff8e4]" : "opacity-80"}`}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-12 w-12 items-center justify-center border-[3px] border-[#3d2914] ${earned ? "bg-[#e3b23c]" : "bg-[#efe4cf]"}`} aria-hidden="true">
          <svg viewBox="0 0 32 32" className="h-8 w-8">
            <rect x="14" y="16" width="4" height="10" fill="#2f6b45" />
            <rect x="8" y="12" width="10" height="6" fill="#3f8f55" />
            <rect x="14" y="8" width="12" height="6" fill="#8fce73" />
            {earned ? <rect x="22" y="20" width="6" height="6" fill="#d84b3a" /> : null}
          </svg>
        </span>
        <p className="text-sm font-semibold text-primary">{status}</p>
      </div>
      <h3 className="mt-3 font-game text-2xl leading-tight">{name}</h3>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </article>
  );
}
