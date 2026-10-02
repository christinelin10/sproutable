import Link from "next/link";

export function JournalDock({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="game-btn fixed bottom-4 right-4 z-30 inline-flex min-h-12 items-center bg-[#e3b23c] px-4 font-game text-lg text-[#3d2914]">
      {label}
    </Link>
  );
}
