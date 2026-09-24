import type { Language } from "@/lib/types";

export function pickLocalized(locale: Language, en: string, es: string): { text: string; fallback: boolean } {
  if (locale === "es") {
    if (es.trim()) return { text: es, fallback: false };
    if (en.trim()) return { text: en, fallback: true };
    return { text: "", fallback: false };
  }
  return { text: en, fallback: false };
}

/** Escape HTML, then allow a tiny markdown subset. Script tags cannot execute. */
export function renderSimpleMarkdown(input: string): string {
  const escaped = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const withInline = escaped
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noreferrer noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  const lines = withInline.split(/\n/);
  const html: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (const line of lines) {
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      list.push(item[1]);
      continue;
    }
    flushList();
    if (line.trim()) html.push(`<p>${line}</p>`);
  }
  flushList();
  return html.join("");
}

export function plainChat(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500);
}
