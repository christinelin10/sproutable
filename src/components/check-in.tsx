"use client";

import { useState } from "react";
import { checkIn } from "@/server/garden-actions";
import { Button } from "@/components/button";

export function CheckInButton({ slug, checkedIn, label, done }: { slug: string; checkedIn: boolean; label: string; done: string }) {
  const [doneNow, setDone] = useState(checkedIn);
  if (doneNow) return <p className="rounded-2xl bg-sun/40 px-4 py-3 font-semibold">{done}</p>;
  return (
    <form
      action={async () => {
        await checkIn(slug);
        setDone(true);
      }}
    >
      <Button type="submit">{label}</Button>
    </form>
  );
}
