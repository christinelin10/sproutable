"use client";

import { useState } from "react";

export function CopyLink({ href, label, done }: { href: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded-full border border-line bg-card px-4 py-2 font-semibold"
      onClick={async () => {
        await navigator.clipboard.writeText(href.startsWith("http") ? href : `${window.location.origin}${href}`);
        setCopied(true);
      }}
    >
      {copied ? done : label}
    </button>
  );
}
