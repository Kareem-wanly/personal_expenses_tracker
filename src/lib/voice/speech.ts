"use client";

/**
 * The device's own speech recognition (Web Speech API): free, no
 * download. Available in Chrome/Android and Safari tabs; often missing in
 * installed iOS PWAs, where the app falls back to Whisper or the
 * keyboard's dictation key.
 */
type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

function ctor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

export function browserSpeechSupported() {
  return ctor() !== null;
}

export function listen({
  lang = "ar-SA",
  onText,
  onEnd,
  onError,
}: {
  lang?: string;
  /** Called with the full transcript so far and whether it is final. */
  onText: (text: string, final: boolean) => void;
  onEnd: () => void;
  onError: (code: string) => void;
}) {
  const C = ctor();
  if (!C) {
    onError("unsupported");
    return () => {};
  }
  const rec = new C();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e) => {
    let text = "";
    let final = true;
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
      if (!e.results[i].isFinal) final = false;
    }
    onText(text.trim(), final);
  };
  rec.onerror = (e) => onError(e.error);
  rec.onend = onEnd;
  rec.start();
  return () => rec.stop();
}
