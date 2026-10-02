import Link from "next/link";

export function QuestCard({
  garden,
  title,
  when,
  detail,
  category,
  href,
  action,
}: {
  garden: string;
  title: string;
  when: string;
  detail: string;
  category: string;
  href: string;
  action: string;
}) {
  return (
    <article className="game-panel flex h-full flex-col p-4">
      <p className="text-sm font-semibold text-primary">{garden}</p>
      <h3 className="mt-1 font-game text-2xl leading-tight">{title}</h3>
      <p className="mt-2 text-sm font-semibold">{when}</p>
      <p className="mt-1 inline-flex w-fit rounded-full bg-[#e7f3dc] px-2 py-0.5 text-sm font-semibold text-[#215c45]">{category}</p>
      {detail ? <p className="mt-3 text-muted">{detail}</p> : null}
      <Link href={href} className="game-btn mt-4 inline-flex min-h-11 items-center self-start bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
        {action}
      </Link>
    </article>
  );
}
