"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type Recording, startRecording } from "@/lib/voice/recorder";
import { browserSpeechSupported, listen } from "@/lib/voice/speech";
import { getVoiceEngine, loadWhisper, transcribe } from "@/lib/voice/whisper-client";

export type VoiceStatus =
  | { phase: "idle" }
  | { phase: "listening"; engine: "browser" | "whisper" }
  | { phase: "loading-model"; progress: number | null }
  | { phase: "transcribing" }
  | { phase: "error"; message: string };

const ERRORS: Record<string, string> = {
  "not-allowed": "اسمح للتطبيق باستخدام الميكروفون من إعدادات المتصفح.",
  "service-not-allowed": "التعرّف على الكلام غير متاح هنا. استخدم زر الميكروفون في لوحة المفاتيح.",
  "no-speech": "ما سمعت شي، جرّب مرة تانية.",
  network: "التعرّف على الكلام يحتاج اتصالاً بالإنترنت على هذا الجهاز.",
  unsupported: "التعرّف على الكلام غير مدعوم هنا. استخدم زر الميكروفون في لوحة المفاتيح.",
};

/**
 * Voice → text with whatever the device offers, all free:
 * Whisper on-device if the user enabled it, otherwise the browser's own
 * speech recognition. `onFinal` gets the finished transcript.
 */
export function useVoiceInput(onFinal: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>({ phase: "idle" });
  const [interim, setInterim] = useState("");
  const stopRef = useRef<(() => void) | null>(null);
  const recordingRef = useRef<Recording | null>(null);
  const finalRef = useRef(onFinal);

  useEffect(() => {
    finalRef.current = onFinal;
  });

  // Never leave the microphone on when the sheet closes.
  useEffect(
    () => () => {
      stopRef.current?.();
      recordingRef.current?.cancel();
    },
    [],
  );

  const start = useCallback(async () => {
    setInterim("");
    const engine = getVoiceEngine();
    navigator.vibrate?.(8);

    if (engine !== "browser") {
      try {
        setStatus({ phase: "loading-model", progress: null });
        await loadWhisper(engine, (loaded, total) =>
          setStatus({ phase: "loading-model", progress: total ? loaded / total : null }),
        );
        recordingRef.current = await startRecording();
        setStatus({ phase: "listening", engine: "whisper" });
      } catch (err) {
        setStatus({ phase: "error", message: (err as Error).name === "NotAllowedError" ? ERRORS["not-allowed"] : "تعذّر تشغيل Whisper على هذا الجهاز." });
      }
      return;
    }

    if (!browserSpeechSupported()) {
      setStatus({ phase: "error", message: ERRORS.unsupported });
      return;
    }
    setStatus({ phase: "listening", engine: "browser" });
    let last = "";
    let failed = false;
    stopRef.current = listen({
      onText: (text, final) => {
        last = text;
        setInterim(text);
        if (final) finalRef.current(text);
      },
      onEnd: () => {
        stopRef.current = null;
        setStatus((s) => (s.phase === "listening" ? { phase: "idle" } : s));
        // A real error (e.g. permission) wins over "heard nothing".
        if (!last && !failed) setStatus({ phase: "error", message: ERRORS["no-speech"] });
      },
      onError: (code) => {
        failed = true;
        setStatus({ phase: "error", message: ERRORS[code] ?? "صار خطأ بالتعرّف على الكلام." });
      },
    });
  }, []);

  const stop = useCallback(async () => {
    if (stopRef.current) {
      stopRef.current();
      return;
    }
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null;
    setStatus({ phase: "transcribing" });
    try {
      const { audio, seconds } = await rec.stop();
      if (seconds < 0.4) {
        setStatus({ phase: "error", message: ERRORS["no-speech"] });
        return;
      }
      const { text } = await transcribe(audio);
      setInterim(text);
      setStatus({ phase: "idle" });
      if (text) finalRef.current(text);
      else setStatus({ phase: "error", message: ERRORS["no-speech"] });
    } catch {
      setStatus({ phase: "error", message: "تعذّر تحويل الصوت لنص." });
    }
  }, []);

  return { status, interim, start, stop, setInterim };
}
