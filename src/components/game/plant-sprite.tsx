import type { JournalStage } from "@/lib/types";

export function PlantSprite({ stage, className = "h-16 w-16" }: { stage?: JournalStage | ""; className?: string }) {
  const fruit = stage === "harvest";
  const leafy = stage === "growing" || stage === "maintenance" || stage === "harvest";
  const sprout = stage === "planted" || leafy;

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect x="6" y="44" width="52" height="14" fill="#8a5a32" />
      <rect x="8" y="46" width="48" height="10" fill="#c4a574" />
      <rect x="10" y="48" width="44" height="6" fill="#6b3f22" />
      {sprout ? <rect x="30" y="28" width="4" height="20" fill="#2f6b45" /> : null}
      {stage === "planted" ? <rect x="26" y="26" width="12" height="6" rx="1" fill="#7dbe6a" /> : null}
      {leafy ? (
        <>
          <rect x="18" y="24" width="14" height="8" fill="#3f8f55" />
          <rect x="32" y="18" width="16" height="8" fill="#2f6b45" />
          <rect x="22" y="16" width="12" height="8" fill="#8fce73" />
        </>
      ) : null}
      {stage === "maintenance" ? <rect x="44" y="30" width="8" height="12" fill="#4aa3c7" /> : null}
      {fruit ? (
        <>
          <rect x="16" y="30" width="8" height="8" fill="#d84b3a" />
          <rect x="40" y="26" width="8" height="8" fill="#e3b23c" />
        </>
      ) : null}
    </svg>
  );
}
