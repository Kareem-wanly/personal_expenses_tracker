"use client";

/**
 * Record from the microphone and return 16 kHz mono PCM, the input Whisper
 * expects. Works in installed PWAs too (it doesn't depend on the browser's
 * speech recognition service).
 */
export type Recording = { stop: () => Promise<{ audio: Float32Array; seconds: number }>; cancel: () => void };

export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start();

  const release = () => stream.getTracks().forEach((t) => t.stop());

  return {
    cancel() {
      if (recorder.state !== "inactive") recorder.stop();
      release();
    },
    stop() {
      return new Promise((resolve, reject) => {
        recorder.onstop = async () => {
          release();
          try {
            const blob = new Blob(chunks, { type: recorder.mimeType });
            const ctx = new AudioContext({ sampleRate: 16_000 });
            const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
            const audio = new Float32Array(decoded.getChannelData(0));
            void ctx.close();
            resolve({ audio, seconds: decoded.duration });
          } catch (err) {
            reject(err);
          }
        };
        recorder.stop();
      });
    },
  };
}
