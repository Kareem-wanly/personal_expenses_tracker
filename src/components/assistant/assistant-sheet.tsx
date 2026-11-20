"use client";

import {
  ArrowUpIcon,
  CheckIcon,
  FlaskConicalIcon,
  Loader2Icon,
  MicIcon,
  SparklesIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
import { AnimatedMoney } from "@/components/motion/animated-money";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { PaymentMethod } from "@/db/schema";
import { type Command, type DraftExpense, type Period, parseCommand } from "@/lib/assistant/parse";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDayLabel, toISODate } from "@/lib/dates";
import { normalizeAmountInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { getSpendingSummary, saveExpense } from "@/server/actions";
import type { CategoryOption } from "@/server/queries";

import { closeAssistant, useAssistantState } from "./assistant-store";
import { useVoiceInput } from "./use-voice-input";

type Props = { categories: CategoryOption[]; currency: string };

const SPRING = { type: "spring", stiffness: 480, damping: 32 } as const;

const EXAMPLES = ["قهوة 5", "20 بنزين و5 قهوة", "امبارح غدا 30 بالبطاقة", "قديش صرفت هالأسبوع؟"];

const PERIOD_LABEL: Record<Period, string> = {
  today: "اليوم",
  yesterday: "امبارح",
  week: "هالأسبوع",
  month: "هالشهر",
  prevMonth: "الشهر الماضي",
};

type Draft = DraftExpense & { key: number; amountText: string };

type Result =
  | { kind: "drafts"; drafts: Draft[] }
  | { kind: "answer"; label: string; total: number; count: number; currency: string; href: string }
  | { kind: "unknown" };

export function AssistantSheet({ categories, currency }: Props) {
  const { open, listen, nonce } = useAssistantState();
  return (
    <Drawer open={open} onOpenChange={(next) => (next ? undefined : closeAssistant())} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-2xl border-t-0 bg-background data-[swipe-direction=down]:rounded-t-[28px] dark:bg-[#1c1c1e] dark:[--card:#2c2c2e]">
        <Assistant key={nonce} categories={categories} currency={currency} autoListen={listen} />
      </DrawerContent>
    </Drawer>
  );
}

function Assistant({ categories, currency, autoListen }: Props & { autoListen: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [thinking, startThinking] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function understand(input: string) {
    const said = input.trim();
    if (!said) return;
    setText(said);
    const cmd: Command = parseCommand(said, { today: toISODate(new Date()), categories });
    if (cmd.kind === "open") {
      closeAssistant();
      router.push(cmd.href);
      return;
    }
    if (cmd.kind === "query") {
      startThinking(async () => {
        const res = await getSpendingSummary({ from: cmd.from, to: cmd.to, categoryId: cmd.categoryId });
        if (!res.ok) return setResult({ kind: "unknown" });
        const cat = categories.find((c) => c.id === cmd.categoryId);
        const month = cmd.from.slice(0, 7);
        setResult({
          kind: "answer",
          label: `${PERIOD_LABEL[cmd.period]}${cat ? ` على ${cat.name}` : ""}`,
          total: res.total,
          count: res.count,
          currency: res.currency,
          href: `/expenses?month=${month}${cat ? `&category=${cat.id}` : ""}`,
        });
      });
      return;
    }
    if (cmd.kind === "add") {
      setResult({
        kind: "drafts",
        drafts: cmd.items.map((d, i) => ({ ...d, key: Date.now() + i, amountText: d.amount ? String(d.amount) : "" })),
      });
      return;
    }
    setResult({ kind: "unknown" });
  }

  const voice = useVoiceInput(understand);
  const listening = voice.status.phase === "listening";
  const busy = voice.status.phase === "loading-model" || voice.status.phase === "transcribing";

  useEffect(() => {
    if (autoListen) void voice.start();
    // Only on mount: a long-press on "+" opens the sheet already listening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = listening || busy ? voice.interim : text;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex h-11 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={closeAssistant} className="text-[17px] text-primary active:opacity-50">
          إغلاق
        </button>
        <DrawerTitle className="pointer-events-none absolute inset-x-0 flex items-center justify-center gap-1.5 text-[17px] font-semibold">
          <SparklesIcon className="size-4 text-primary" />
          المساعد
        </DrawerTitle>
        <DrawerDescription className="sr-only">احكِ أو اكتب مصروفك أو سؤالك</DrawerDescription>
        <Link
          href="/voice-lab"
          onClick={closeAssistant}
          aria-label="مختبر الصوت"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:opacity-50"
        >
          <FlaskConicalIcon className="size-5" />
        </Link>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Microphone */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="relative">
            <AnimatePresence>
              {listening && (
                <>
                  {[0, 1].map((i) => (
                    <motion.span
                      key={i}
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-primary/25"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ scale: 1.9, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() => (listening ? voice.stop() : voice.start())}
              disabled={busy}
              whileTap={{ scale: 0.9 }}
              transition={SPRING}
              aria-label={listening ? "إيقاف" : "تكلّم"}
              className="tint-button relative flex size-20 items-center justify-center rounded-full disabled:opacity-80"
            >
              {busy ? (
                <Loader2Icon className="size-8 animate-spin" />
              ) : listening ? (
                <SquareIcon className="size-7 fill-current" />
              ) : (
                <MicIcon className="size-9" strokeWidth={2.2} />
              )}
            </motion.button>
          </div>
          <StatusLine status={voice.status} />
          <AnimatePresence mode="wait">
            {shown && (
              <motion.p
                key={shown}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-md text-center text-[19px] font-semibold leading-relaxed"
              >
                «{shown}»
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Type instead (or use the keyboard's own dictation key) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            understand(inputRef.current?.value ?? "");
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="surface flex items-center gap-2 py-1.5 pe-1.5 ps-4"
        >
          <input
            ref={inputRef}
            aria-label="اكتب مصروفك أو سؤالك"
            placeholder="أو اكتب: قهوة 5 · قديش صرفت اليوم؟"
            enterKeyHint="send"
            className="h-10 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="إرسال"
            className="tint-button flex size-9 shrink-0 items-center justify-center rounded-full active:scale-90"
          >
            <ArrowUpIcon className="size-5" strokeWidth={2.6} />
          </button>
        </form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {thinking ? (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-6">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </motion.div>
          ) : result ? (
            <motion.div
              key={JSON.stringify(result).length + (result.kind === "drafts" ? result.drafts.length : 0)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {result.kind === "drafts" && (
                <Drafts
                  drafts={result.drafts}
                  onChange={(drafts) => setResult({ kind: "drafts", drafts })}
                  categories={categories}
                  currency={currency}
                />
              )}
              {result.kind === "answer" && <Answer {...result} />}
              {result.kind === "unknown" && <Unknown onPick={understand} />}
            </motion.div>
          ) : (
            <motion.div key="examples" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">جرّب تقول</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => understand(ex)}
                    className="rounded-full bg-card px-3.5 py-2 text-[14px] shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:scale-95"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: ReturnType<typeof useVoiceInput>["status"] }) {
  const text =
    status.phase === "listening"
      ? status.engine === "whisper"
        ? "عم سجّل… اضغط مرة تانية لما تخلص"
        : "عم اسمعك…"
      : status.phase === "loading-model"
        ? `عم جهّز Whisper${status.progress !== null ? ` ${Math.round(status.progress * 100)}%` : "…"}`
        : status.phase === "transcribing"
          ? "عم حوّل الصوت لنص…"
          : status.phase === "error"
            ? status.message
            : "اضغط وتكلّم";
  return (
    <p
      role="status"
      className={cn(
        "min-h-5 max-w-xs text-center text-[14px]",
        status.phase === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {text}
    </p>
  );
}

/* --------------------------------- Drafts -------------------------------- */

function Drafts({
  drafts,
  onChange,
  categories,
  currency,
}: {
  drafts: Draft[];
  onChange: (d: Draft[]) => void;
  categories: CategoryOption[];
  currency: string;
}) {
  const [saving, startSaving] = useTransition();
  const today = toISODate(new Date());
  const valid = drafts.length > 0 && drafts.every((d) => Number(normalizeAmountInput(d.amountText)) > 0);

  const update = (key: number, patch: Partial<Draft>) =>
    onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  function saveAll() {
    startSaving(async () => {
      let saved = 0;
      for (const d of drafts) {
        const fd = new FormData();
        fd.set("amount", d.amountText);
        fd.set("categoryId", d.categoryId ?? "");
        fd.set("date", d.date);
        fd.set("note", d.note ?? "");
        fd.set("paymentMethod", d.paymentMethod);
        const res = await saveExpense({ ok: false }, fd);
        if (res.ok) saved++;
        else toast.error(res.message ?? "تعذّر الحفظ");
      }
      if (saved > 0) {
        navigator.vibrate?.(10);
        toast.success(saved === 1 ? "تمت إضافة المصروف" : `تمت إضافة ${saved} مصاريف`);
        closeAssistant();
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-[13px] font-medium text-muted-foreground">
        {drafts.length === 1 ? "فهمت هيك، عدّل إذا لازم:" : `فهمت ${drafts.length} مصاريف، عدّل إذا لازم:`}
      </p>
      <AnimatePresence initial={false}>
        {drafts.map((d) => {
          const cat = categories.find((c) => c.id === d.categoryId) ?? null;
          const missing = !(Number(normalizeAmountInput(d.amountText)) > 0);
          return (
            <motion.div
              key={d.key}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              transition={SPRING}
              className="surface space-y-3 p-3"
            >
              <div className="flex items-center gap-3">
                <CategoryIcon icon={cat?.icon ?? "❔"} color={cat?.color ?? null} className="size-11 rounded-[12px]" />
                <div className="min-w-0 flex-1">
                  <select
                    aria-label="التصنيف"
                    value={d.categoryId ?? ""}
                    onChange={(e) => update(d.key, { categoryId: e.target.value || null })}
                    className={cn(
                      "w-full appearance-none bg-transparent text-[16px] font-semibold outline-none",
                      !cat && "text-destructive",
                    )}
                  >
                    <option value="">اختر التصنيف…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="ملاحظة"
                    value={d.note ?? ""}
                    onChange={(e) => update(d.key, { note: e.target.value || null })}
                    placeholder="ملاحظة"
                    className="w-full bg-transparent text-[13px] text-muted-foreground outline-none"
                  />
                </div>
                <div className="flex items-baseline gap-1" dir="ltr">
                  <input
                    aria-label="المبلغ"
                    inputMode="decimal"
                    value={d.amountText}
                    onChange={(e) => update(d.key, { amountText: e.target.value })}
                    placeholder="0"
                    className={cn(
                      "w-24 bg-transparent text-end text-[22px] font-bold outline-none tabular",
                      missing && "rounded-md ring-2 ring-destructive/60",
                    )}
                  />
                  <span className="text-[12px] text-muted-foreground">{currency}</span>
                </div>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    aria-label="إزالة"
                    onClick={() => onChange(drafts.filter((x) => x.key !== d.key))}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="relative text-[13px] font-medium text-primary">
                  {formatDayLabel(d.date, today)}
                  <input
                    type="date"
                    aria-label="التاريخ"
                    value={d.date}
                    max={today}
                    onChange={(e) => e.target.value && update(d.key, { date: e.target.value })}
                    className="absolute inset-0 opacity-0"
                  />
                </label>
                <SegmentedControl
                  label="طريقة الدفع"
                  value={d.paymentMethod}
                  onChange={(v: PaymentMethod) => update(d.key, { paymentMethod: v })}
                  className="w-44"
                  options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
                    value: value as PaymentMethod,
                    label,
                  }))}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={saveAll}
        disabled={!valid || saving}
        whileTap={{ scale: 0.97 }}
        className="tint-button flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold disabled:opacity-50"
      >
        {saving ? <Loader2Icon className="size-5 animate-spin" /> : <CheckIcon className="size-5" strokeWidth={2.6} />}
        {drafts.length === 1 ? "حفظ" : `حفظ الكل (${drafts.length})`}
      </motion.button>
    </div>
  );
}

/* --------------------------------- Answer -------------------------------- */

function Answer({ label, total, count, currency, href }: Extract<Result, { kind: "answer" }>) {
  return (
    <div className="surface flex flex-col items-center gap-1 px-4 py-6 text-center">
      <p className="text-[15px] text-muted-foreground">صرفت {label}</p>
      <AnimatedMoney value={total} currency={currency} className="text-[36px] font-bold tracking-tight tabular" />
      <p className="text-[13px] text-muted-foreground">
        {count === 0 ? "ما في مصاريف بهالفترة" : `في ${count} ${count === 1 ? "عملية" : "عمليات"}`}
      </p>
      <Link
        href={href}
        onClick={closeAssistant}
        className="mt-3 text-[15px] font-medium text-primary active:opacity-60"
      >
        عرض التفاصيل
      </Link>
    </div>
  );
}

function Unknown({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="surface space-y-3 p-4 text-center">
      <p className="text-[16px] font-semibold">ما فهمت عليك 🙏</p>
      <p className="text-[14px] text-muted-foreground">
        قول المبلغ وعلى شو صرفته، أو اسأل عن مصاريفك. مثلاً:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onPick(ex)}
            className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-[13px] active:scale-95 dark:bg-white/10"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
