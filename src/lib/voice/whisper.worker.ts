/// <reference lib="webworker" />
/**
 * Runs Whisper (Transformers.js) off the main thread so the UI never
 * stutters while the model downloads, compiles or transcribes.
 * The model files are cached by the browser after the first download.
 */
import {
  type AutomaticSpeechRecognitionPipeline,
  type ProgressInfo,
  env,
  pipeline,
} from "@huggingface/transformers";

import type { WhisperRequest, WhisperResponse } from "./whisper-protocol";

env.allowLocalModels = false;

declare const self: DedicatedWorkerGlobalScope;

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let loadedKey = "";

const post = (msg: WhisperResponse) => self.postMessage(msg);

async function load(repos: string[], device: "webgpu" | "wasm") {
  const key = `${repos[0]}|${device}`;
  if (transcriber && loadedKey === key) return;
  await transcriber?.dispose();
  transcriber = null;

  // WebGPU: full-precision encoder (accuracy), 4-bit decoder (size/speed).
  // WASM: 8-bit everywhere, the best speed/size trade-off on CPU.
  const dtype =
    device === "webgpu"
      ? ({ encoder_model: "fp32", decoder_model_merged: "q4" } as const)
      : ("q8" as const);

  let lastError: unknown;
  for (const repo of repos) {
    try {
      const started = performance.now();
      transcriber = (await pipeline("automatic-speech-recognition", repo, {
        device,
        dtype,
        progress_callback: (p: ProgressInfo) => {
          if (p.status === "progress_total") {
            post({ type: "progress", loaded: p.loaded, total: p.total });
          }
        },
      })) as AutomaticSpeechRecognitionPipeline;
      loadedKey = key;
      post({ type: "loaded", repo, device, ms: Math.round(performance.now() - started) });
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

self.onmessage = async (e: MessageEvent<WhisperRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === "load") {
      await load(msg.repos, msg.device);
    } else if (msg.type === "transcribe") {
      if (!transcriber) throw new Error("النموذج غير محمّل");
      const started = performance.now();
      const out = await transcriber(msg.audio, {
        language: "arabic",
        task: "transcribe",
        chunk_length_s: 30,
      });
      const text = (Array.isArray(out) ? out[0]?.text : out.text) ?? "";
      post({ type: "result", id: msg.id, text: text.trim(), ms: Math.round(performance.now() - started) });
    }
  } catch (err) {
    post({
      type: "error",
      id: msg.type === "transcribe" ? msg.id : undefined,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
