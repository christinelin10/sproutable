import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=en|es`,
      { next: { revalidate: 0 } },
    );
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || String(translated).includes("MYMEMORY WARNING")) {
      return NextResponse.json({ error: "translate" }, { status: 502 });
    }
    return NextResponse.json({ text: translated });
  } catch {
    return NextResponse.json({ error: "translate" }, { status: 502 });
  }
}
