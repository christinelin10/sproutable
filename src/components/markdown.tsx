import { renderSimpleMarkdown } from "@/lib/text";

export function Markdown({ text }: { text: string }) {
  return <div className="prose-garden" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(text) }} />;
}
