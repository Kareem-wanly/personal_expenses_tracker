/** Messages between the app and the Whisper worker. */
export type WhisperRequest =
  | { type: "load"; repos: string[]; device: "webgpu" | "wasm" }
  | { type: "transcribe"; id: number; audio: Float32Array };

export type WhisperResponse =
  | { type: "progress"; loaded: number; total: number }
  | { type: "loaded"; repo: string; device: "webgpu" | "wasm"; ms: number }
  | { type: "result"; id: number; text: string; ms: number }
  | { type: "error"; id?: number; message: string };

export type WhisperSize = "tiny" | "base" | "small";

/** Candidate repos per size, tried in order (multilingual checkpoints). */
export const WHISPER_MODELS: Record<
  WhisperSize,
  { repos: string[]; label: string; approxMB: string; note: string }
> = {
  tiny: {
    repos: ["onnx-community/whisper-tiny", "Xenova/whisper-tiny"],
    label: "صغير جداً",
    approxMB: "≈ 40–100",
    note: "الأسرع، دقته بالعربي ضعيفة على الأرجح",
  },
  base: {
    repos: ["onnx-community/whisper-base", "Xenova/whisper-base"],
    label: "متوسط",
    approxMB: "≈ 80–200",
    note: "توازن بين السرعة والدقة",
  },
  small: {
    repos: ["onnx-community/whisper-small", "Xenova/whisper-small"],
    label: "كبير",
    approxMB: "≈ 250–600",
    note: "الأدق بالعربي، والأبطأ والأثقل",
  },
};
