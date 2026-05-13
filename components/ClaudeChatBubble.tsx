"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { City } from "@/lib/types";
import claudeLogo from "./claudelogo.png";

type ClaudeChatBubbleProps = {
  city: City | null;
};

export default function ClaudeChatBubble({ city }: ClaudeChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setOpen(false);
      return;
    }
    setQuestion("");
    setAnswer("");
    setLoading(false);
  }, [city]);

  if (!city) {
    return null;
  }

  const askClaude = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question.trim(), city }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setAnswer(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setAnswer(data.reply ?? "");
    } catch {
      setAnswer("Could not reach the chat service. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="pointer-events-none fixed z-[100] flex flex-col items-end gap-3"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      {open ? (
        <div
          key={city.city}
          className="pointer-events-auto animate-fade-in flex max-h-[min(72vh,520px)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-black/12 bg-white/55 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Image
                src={claudeLogo}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-black">Ask Claude</p>
                <p className="truncate text-[11px] text-black/55">About {city.city}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="glass-chip shrink-0 rounded-lg border-black/10 p-1.5 text-black/50 transition hover:border-black/20 hover:bg-white/40 hover:text-black"
              aria-label="Minimize chat"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
            <p className="mb-3 text-xs text-black/55">Ask Claude about this city</p>
            <textarea
              className="w-full resize-none rounded-lg border border-black/15 bg-white/60 p-3 text-sm text-black shadow-inner placeholder:text-black/35 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              rows={3}
              placeholder="Why is this city described this way?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              aria-label="Question for Claude"
            />
            <button
              type="button"
              onClick={askClaude}
              disabled={loading || !question.trim()}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
            {answer ? (
              <div
                key={answer.slice(0, 120)}
                className="animate-fade-in mt-3 rounded-lg border border-black/10 bg-white/50 p-3 text-sm leading-relaxed text-black/85 shadow-sm"
              >
                {answer}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-2 ring-white/90 backdrop-blur-md transition hover:scale-105 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-label={open ? "Close Ask Claude" : "Open Ask Claude"}
      >
        <Image
          src={claudeLogo}
          alt="Claude"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
      </button>
    </div>
  );
}
