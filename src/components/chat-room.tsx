"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { moderateChat, postChat } from "@/server/garden-actions";
import { Button } from "@/components/button";

type Message = { id: string; name: string; body: string; createdAt: string; deleted: boolean; userId: string };

export function ChatRoom({ slug, loggedIn }: { slug: string; loggedIn: boolean }) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [banned, setBanned] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  async function load() {
    const response = await fetch(`/api/gardens/${slug}/chat`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setMessages(data.messages);
    setBanned(data.banned);
    setCanModerate(data.canModerate);
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [slug]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      {banned ? <p className="mt-3 rounded-2xl bg-sun/40 px-4 py-3">{t("banned")}</p> : null}
      <ul className="mt-6 space-y-3" aria-live="polite">
        {messages.length === 0 ? <li className="text-muted">{t("empty")}</li> : null}
        {messages.map((message) => (
          <li key={message.id} className="rounded-2xl border border-line bg-card p-3">
            <p className="text-sm font-semibold">
              {message.name} · <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
            </p>
            <p className={message.deleted ? "italic text-muted" : ""}>{message.deleted ? t("removed") : message.body}</p>
            {canModerate && !message.deleted ? (
              <div className="mt-2 flex gap-2">
                <button type="button" className="text-sm font-semibold" onClick={() => moderateChat(slug, message.id, "delete").then(load)}>
                  {t("delete")}
                </button>
                <button type="button" className="text-sm font-semibold" onClick={() => moderateChat(slug, message.id, "ban").then(load)}>
                  {t("ban")}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {loggedIn && !banned ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await postChat(slug, text);
            if (result?.error) setError(result.error);
            else {
              setText("");
              setError("");
              await load();
            }
          }}
        >
          <label className="sr-only" htmlFor="chat-body">
            {t("placeholder")}
          </label>
          <input
            id="chat-body"
            value={text}
            maxLength={500}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("placeholder")}
            className="w-full rounded-xl border border-line px-3 py-2"
          />
          <Button type="submit">{t("send")}</Button>
        </form>
      ) : null}
      {!loggedIn ? <p className="mt-4 rounded-2xl bg-card px-4 py-3">{t("login")}</p> : null}
      {error ? <p className="mt-2 text-[#8d2f2f]">{error}</p> : null}
    </section>
  );
}
