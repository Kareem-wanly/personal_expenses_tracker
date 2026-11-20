"use client";

import { CheckIcon, ChevronRightIcon, CpuIcon, Loader2Icon, MicIcon, SquareIcon, ZapIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Group, Row, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { parseCommand } from "@/lib/assistant/parse";
import { toISODate } from "@/lib/dates";
import { type Recording, startRecording } from "@/lib/voice/recorder";
import { browserSpeechSupported, listen } from "@/lib/voice/speech";
import {
  type VoiceEngine,
  getVoiceEngine,
  loadWhisper,
  pickDevice,
  setVoiceEngine,
  transcribe,
} from "@/lib/voice/whisper-client";
import { WHISPER_MODELS, type WhisperSize } from "@/lib/voice/whisper-protocol";
import type { CategoryOption } from "@/server/queries";

type Trial = {
  id: number;
  engine: string;
  text: string;
  audioSec: number | null;
  ms: number;
  understood: string;
};

const noop = () => () => {};
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(0)} MB`;

/**
 * Lets the user try Whisper sizes on their own phone and voice: download,
 * record, read the transcript and timings, then pick one for the assistant.
 */
export function VoiceLab({ categories }: { categories: CategoryOption[] }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [size, setSize] = useState<WhisperSize>("base");
  const [device, setDevice] = useState<"webgpu" | "wasm" | null>(null);
  const [load, setLoad] = useState<
    | { state: "idle" }
    | { state: "loading"; loaded: number; total: number }
    | { state: "ready"; repo: string; device: string; ms: number }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [rec, setRec] = useState<"idle" | "recording" | "working">("idle");
  const recording = useRef<Recording | null>(null);
  const started = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  // Read once on the client (the lab renders nothing until mounted).
  const [engine, setEngineState] = useState<VoiceEngine>(getVoiceEngine);

  useEffect(() => {
    void pickDevice().then(setDevice);
  }, []);

  useEffect(() => {
    if (rec !== "recording") return;
    const t = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 100);
    return () => clearInterval(t);
  }, [rec]);

  function describe(text: string) {
    const cmd = parseCommand(text, { today: toISODate(new Date()), categories });
    if (cmd.kind === "add") {
      return cmd.items
        .map((i) => {
          const cat = categories.find((c) => c.id === i.categoryId);
          return `${i.amount ?? "؟"} · ${cat ? cat.name : "بدون تصنيف"}${i.note ? ` · ${i.note}` : ""}`;
        })
        .join(" + ");
    }
    if (cmd.kind === "query") return `سؤال عن المصاريف (${cmd.from} → ${cmd.to})`;
    if (cmd.kind === "open") return `فتح ${cmd.href}`;
    return "ما فهم الجملة";
  }

  function addTrial(t: Omit<Trial, "id" | "understood">) {
    setTrials((all) => [{ ...t, id: Date.now(), understood: describe(t.text) }, ...all]);
  }

  async function download() {
    setLoad({ state: "loading", loaded: 0, total: 0 });
    try {
      const res = await loadWhisper(size, (loaded, total) => setLoad({ state: "loading", loaded, total }));
      setLoad({ state: "ready", ...res });
    } catch (err) {
      setLoad({ state: "error", message: (err as Error).message });
    }
  }

  async function toggleRecord() {
    if (rec === "recording") {
      const r = recording.current;
      recording.current = null;
      if (!r) return;
      setRec("working");
      try {
        const { audio, seconds } = await r.stop();
        const { text, ms } = await transcribe(audio);
        addTrial({ engine: `Whisper ${size}`, text: text || "(فارغ)", audioSec: seconds, ms });
      } catch (err) {
        toast.error((err as Error).message);
      }
      setRec("idle");
      return;
    }
    try {
      recording.current = await startRecording();
      started.current = Date.now();
      setElapsed(0);
      setRec("recording");
    } catch {
      toast.error("اسمح للتطبيق باستخدام الميكروفون");
    }
  }

  function tryBrowser() {
    const t0 = performance.now();
    setRec("working");
    let done = false;
    listen({
      onText: (text, final) => {
        if (final && !done) {
          done = true;
          addTrial({ engine: "محرك الجهاز", text, audioSec: null, ms: Math.round(performance.now() - t0) });
        }
      },
      onEnd: () => setRec("idle"),
      onError: (code) => {
        setRec("idle");
        toast.error(code === "not-allowed" ? "اسمح باستخدام الميكروفون" : `محرك الجهاز: ${code}`);
      },
    });
  }

  function choose(e: VoiceEngine) {
    setVoiceEngine(e);
    setEngineState(e);
    toast.success(e === "browser" ? "المساعد يستخدم محرك الجهاز" : `المساعد يستخدم Whisper ${e}`);
  }

  if (!mounted) return null;
  const model = WHISPER_MODELS[size];
  const ready = load.state === "ready";

  return (
    <div className="space-y-7">
      <Link href="/settings" className="-mt-2 inline-flex items-center gap-0.5 text-[17px] text-primary active:opacity-60">
        <ChevronRightIcon className="size-5" />
        الإعدادات
      </Link>

      <Group header="جهازك" footer="Whisper يعمل على جهازك بالكامل: الصوت لا يُرسل لأي خادم، والنموذج يُحمّل مرة واحدة.">
        <Row
          leading={<RowIcon icon={device === "webgpu" ? ZapIcon : CpuIcon} tint={device === "webgpu" ? "#34c759" : "#8e8e93"} />}
          title="التسريع"
          trailing={<span className="text-[15px] text-muted-foreground">{device === null ? "…" : device === "webgpu" ? "WebGPU ✓" : "المعالج (WASM)"}</span>}
        />
        <Row
          leading={<RowIcon icon={MicIcon} tint="#ff9f0a" />}
          title="محرك الجهاز للكلام"
          trailing={<span className="text-[15px] text-muted-foreground">{browserSpeechSupported() ? "متاح" : "غير متاح هنا"}</span>}
        />
      </Group>

      <Group header="1 · اختر النموذج وحمّله" footer={`${model.note}. الحجم التقريبي ${model.approxMB} MB.`}>
        <Row
          title="الحجم"
          trailing={
            <SegmentedControl
              label="حجم النموذج"
              value={size}
              onChange={(v) => {
                setSize(v);
                setLoad({ state: "idle" });
              }}
              className="w-56"
              options={(Object.keys(WHISPER_MODELS) as WhisperSize[]).map((k) => ({ value: k, label: k }))}
            />
          }
        />
        {load.state === "ready" ? (
          <Row
            leading={<RowIcon icon={CheckIcon} tint="#34c759" />}
            title="جاهز"
            subtitle={`${load.repo} · ${load.device} · ${(load.ms / 1000).toFixed(1)} ث للتحميل`}
          />
        ) : (
          <RowButton
            onClick={download}
            disabled={load.state === "loading"}
            className="text-primary"
            title={
              load.state === "loading"
                ? load.total
                  ? `عم ينزل… ${mb(load.loaded)} من ${mb(load.total)}`
                  : "عم يجهّز…"
                : `تحميل Whisper ${size}`
            }
            subtitle={load.state === "error" ? `فشل: ${load.message}` : undefined}
            trailing={load.state === "loading" ? <Loader2Icon className="size-5 animate-spin text-muted-foreground" /> : undefined}
          />
        )}
        {load.state === "loading" && load.total > 0 && (
          <div className="px-4 pb-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${(load.loaded / load.total) * 100}%` }}
                transition={{ ease: "linear", duration: 0.2 }}
              />
            </div>
          </div>
        )}
      </Group>

      <section className="space-y-3">
        <h2 className="px-4 text-[13px] font-medium text-muted-foreground">2 · سجّل جملة وجرّب</h2>
        <div className="surface flex flex-col items-center gap-3 p-5">
          <motion.button
            type="button"
            onClick={toggleRecord}
            disabled={!ready || rec === "working"}
            whileTap={{ scale: 0.9 }}
            className="tint-button flex size-20 items-center justify-center rounded-full disabled:opacity-40"
            aria-label={rec === "recording" ? "إيقاف التسجيل" : "ابدأ التسجيل"}
          >
            {rec === "working" ? (
              <Loader2Icon className="size-8 animate-spin" />
            ) : rec === "recording" ? (
              <SquareIcon className="size-7 fill-current" />
            ) : (
              <MicIcon className="size-9" />
            )}
          </motion.button>
          <p className="text-[14px] text-muted-foreground">
            {!ready
              ? "حمّل نموذجاً أولاً"
              : rec === "recording"
                ? `عم سجّل… ${elapsed.toFixed(1)} ث — اضغط للإيقاف`
                : rec === "working"
                  ? "عم حوّل الصوت لنص…"
                  : "مثلاً: «صرفت عشرين دولار على البنزين امبارح»"}
          </p>
          {browserSpeechSupported() && (
            <button
              type="button"
              onClick={tryBrowser}
              disabled={rec !== "idle"}
              className="text-[14px] font-medium text-primary active:opacity-60 disabled:opacity-40"
            >
              قارن بمحرك الجهاز
            </button>
          )}
        </div>
      </section>

      <AnimatePresence initial={false}>
        {trials.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Group header="النتائج" footer="«سرعة» = مدة التحويل ÷ طول التسجيل. أقل من 1× يعني أسرع من الكلام نفسه.">
              {trials.map((t) => (
                <Row
                  key={t.id}
                  title={<span className="whitespace-normal">«{t.text}»</span>}
                  subtitle={
                    <>
                      <span className="block">
                        {t.engine} · {(t.ms / 1000).toFixed(1)} ث
                        {t.audioSec ? ` · تسجيل ${t.audioSec.toFixed(1)} ث · سرعة ${(t.ms / 1000 / t.audioSec).toFixed(2)}×` : ""}
                      </span>
                      <span className="block text-primary">فهم: {t.understood}</span>
                    </>
                  }
                />
              ))}
            </Group>
          </motion.div>
        )}
      </AnimatePresence>

      <Group header="3 · اختر محرك المساعد" footer="محرك الجهاز لا يحتاج تحميلاً، لكنه قد لا يعمل في التطبيق المثبّت على آيفون.">
        <RowButton
          onClick={() => choose("browser")}
          title="محرك الجهاز"
          trailing={engine === "browser" ? <CheckIcon className="size-5 text-primary" /> : undefined}
        />
        {(Object.keys(WHISPER_MODELS) as WhisperSize[]).map((k) => (
          <RowButton
            key={k}
            onClick={() => choose(k)}
            title={`Whisper ${k}`}
            subtitle={WHISPER_MODELS[k].label}
            trailing={engine === k ? <CheckIcon className="size-5 text-primary" /> : undefined}
          />
        ))}
      </Group>
    </div>
  );
}
