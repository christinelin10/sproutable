"use client";

import { useState } from "react";
import { finishWelcome } from "@/server/auth-actions";

export function WelcomeTour({
  title,
  intro,
  idea,
  areas,
  buddiesTitle,
  buddiesBody,
  nextLabel,
  startLabel,
  skipLabel,
}: {
  title: string;
  intro: string;
  idea: string;
  areas: { title: string; body: string }[];
  buddiesTitle: string;
  buddiesBody: string;
  nextLabel: string;
  startLabel: string;
  skipLabel: string;
}) {
  const [step, setStep] = useState(0);
  const last = step === 2;
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <form action={finishWelcome} className="text-right">
        <button type="submit" className="font-semibold text-primary underline">{skipLabel}</button>
      </form>
      {step === 0 ? (
        <div className="game-panel bg-[#fffdf8] p-6">
          <p className="font-semibold text-primary">Sproutable</p>
          <h1 className="mt-2 font-game text-4xl text-[#3d2914] sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg">{intro}</p>
          <p className="mt-3 text-lg text-muted">{idea}</p>
        </div>
      ) : null}
      {step === 1 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {areas.map((area) => (
            <li key={area.title} className="game-panel bg-[#fffdf8] p-4">
              <h2 className="font-game text-2xl text-[#3d2914]">{area.title}</h2>
              <p className="mt-2 text-muted">{area.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {step === 2 ? (
        <div className="game-panel bg-[#fffdf8] p-6">
          <h2 className="font-game text-4xl text-[#3d2914]">{buddiesTitle}</h2>
          <p className="mt-4 text-lg">{buddiesBody}</p>
        </div>
      ) : null}
      <div className="mt-4 flex justify-end">
        {last ? (
          <form action={finishWelcome}>
            <button type="submit" className="game-btn min-h-11 bg-[#215c45] px-5 font-semibold text-[#f7f3ea]">{startLabel}</button>
          </form>
        ) : (
          <button type="button" className="game-btn min-h-11 bg-[#215c45] px-5 font-semibold text-[#f7f3ea]" onClick={() => setStep((value) => value + 1)}>
            {nextLabel}
          </button>
        )}
      </div>
    </section>
  );
}
