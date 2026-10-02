import Link from "next/link";

export function StoryCard({
  href,
  author,
  garden,
  crop,
  when,
  text,
  action,
}: {
  href: string;
  author: string;
  garden: string;
  crop: string;
  when: string;
  text: string;
  action: string;
}) {
  return (
    <article className="rounded-2xl border border-line bg-card p-4">
      <p className="text-sm font-semibold text-primary">
        {author}
        {garden ? ` · ${garden}` : ""}
      </p>
      <h3 className="mt-1 text-xl font-semibold">{crop || garden}</h3>
      <p className="mt-1 text-sm text-muted">{when}</p>
      <p className="mt-3">{text}</p>
      <Link href={href} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline">
        {action}
      </Link>
    </article>
  );
}
