"use client";

import {
  WHISPER_MODELS,
  type WhisperRequest,
  type WhisperResponse,
  type WhisperSize,
} from "./whisper-protocol";

/**
 * Thin promise API over the Whisper worker. One worker for the whole app;
 * created on first use so the ~MBs of runtime only load for people who
 * turn the feature on.
 */
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: { text: string; ms: number }) => void; reject: (e: Error) => void }>();
let loading: {
  key: string;
  promise: Promise<{ repo: string; device: string; ms: number }>;
  onProgress: Set<(loaded: number, total: number) => void>;
} | null = null;
let loadedKey = "";

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<WhisperResponse>) => {
    const msg = e.data;
    if (msg.type === "progress") loading?.onProgress.forEach((cb) => cb(msg.loaded, msg.total));
    if (msg.type === "result") {
      pending.get(msg.id)?.resolve({ text: msg.text, ms: msg.ms });
      pending.delete(msg.id);
    }
    if (msg.type === "error" && msg.id !== undefined) {
      pending.get(msg.id)?.reject(new Error(msg.message));
      pending.delete(msg.id);
    }
  };
  return worker;
}

export async function pickDevice(): Promise<"webgpu" | "wasm"> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (gpu && (await gpu.requestAdapter())) return "webgpu";
  } catch {
    /* fall through */
  }
  return "wasm";
}

export function loadWhisper(
  size: WhisperSize,
  onProgress?: (loaded: number, total: number) => void,
): Promise<{ repo: string; device: string; ms: number }> {
  const key = size;
  if (loading?.key === key) {
    if (onProgress) loading.onProgress.add(onProgress);
    return loading.promise;
  }
  const w = getWorker();
  const listeners = new Set<(l: number, t: number) => void>(onProgress ? [onProgress] : []);
  const promise = (async () => {
    const device = await pickDevice();
    return new Promise<{ repo: string; device: string; ms: number }>((resolve, reject) => {
      const onMsg = (e: MessageEvent<WhisperResponse>) => {
        const msg = e.data;
        if (msg.type === "loaded") {
          w.removeEventListener("message", onMsg);
          loadedKey = key;
          resolve({ repo: msg.repo, device: msg.device, ms: msg.ms });
        } else if (msg.type === "error" && msg.id === undefined) {
          w.removeEventListener("message", onMsg);
          if (loading?.key === key) loading = null;
          reject(new Error(msg.message));
        }
      };
      w.addEventListener("message", onMsg);
      const req: WhisperRequest = { type: "load", repos: WHISPER_MODELS[size].repos, device };
      w.postMessage(req);
    });
  })();
  loading = { key, promise, onProgress: listeners };
  return promise;
}

export function isWhisperLoaded(size: WhisperSize) {
  return loadedKey === size;
}

export function transcribe(audio: Float32Array): Promise<{ text: string; ms: number }> {
  const w = getWorker();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const req: WhisperRequest = { type: "transcribe", id, audio };
    w.postMessage(req, [audio.buffer]);
  });
}

/* ---------------------------- User preference ---------------------------- */

const PREF_KEY = "voice-engine";

/** "browser" = the device's own speech recognition; else a Whisper size. */
export type VoiceEngine = "browser" | WhisperSize;

export function getVoiceEngine(): VoiceEngine {
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === "tiny" || v === "base" || v === "small") return v;
  } catch {
    /* private mode */
  }
  return "browser";
}

export function setVoiceEngine(engine: VoiceEngine) {
  try {
    localStorage.setItem(PREF_KEY, engine);
  } catch {
    /* private mode */
  }
}
