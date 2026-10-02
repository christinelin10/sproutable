"use client";

import { useState } from "react";

export function TranslateText({ text, label, toEnglish }: { text: string; label: string; toEnglish: boolean }) {
  const [result, setResult] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-sm font-semibold text-primary underline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            const pair = toEnglish ? "es|en" : "en|es";
            const response = await fetch(`/api/translate?pair=${pair}&q=${encodeURIComponent(text)}`);
            const data = await response.json();
            setResult(data.text || "");
          } catch {
            setResult("");
          } finally {
            setPending(false);
          }
        }}
      >
        {label}
      </button>
      {result ? <p className="mt-1 text-sm text-muted">{result}</p> : null}
    </div>
  );
}
