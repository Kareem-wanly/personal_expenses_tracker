"use client";

import { MicIcon } from "lucide-react";

import { openAssistant } from "./assistant-store";

/** Round glass mic button for headers. */
export function AssistantButton() {
  return (
    <button
      type="button"
      onClick={() => openAssistant()}
      aria-label="المساعد الصوتي"
      className="glass flex size-10 items-center justify-center rounded-full text-primary transition-transform active:scale-90"
    >
      <MicIcon className="size-5" strokeWidth={2.3} />
    </button>
  );
}
