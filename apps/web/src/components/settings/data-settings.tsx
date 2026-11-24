"use client";

import { DownloadIcon, Loader2Icon, ShieldCheckIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Group, RowButton, RowIcon } from "@/components/ui/grouped-list";
import { authClient } from "@/lib/auth-client";
import { countExpenses } from "@masrufi/core/plural";

const rowLink =
  "flex w-full items-center gap-3 ps-4 text-start transition-colors duration-150 active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.04] focus-visible:outline-none";

/** Backup, restore and the privacy policy. */
export function DataSettings() {
  return (
    <Group
        header="البيانات والخصوصية"
        footer="النسخة ملف واحد فيه كل بياناتك. الاستعادة تضيف ما ينقص فقط، ولا تكرّر ما هو موجود."
      >
        <a href="/api/backup" download className={rowLink}>
          <RowIcon icon={DownloadIcon} />
          <span className="list-row-body flex min-h-11 flex-1 items-center py-2.5 pe-4 text-[16px]">
            تنزيل نسخة من بياناتك
          </span>
        </a>
        <RestoreRow />
        <Link href="/privacy" className={rowLink}>
          <RowIcon icon={ShieldCheckIcon} />
          <span className="list-row-body flex min-h-11 flex-1 items-center py-2.5 pe-4 text-[16px]">
            سياسة الخصوصية
          </span>
        </Link>
    </Group>
  );
}

function RestoreRow() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onFile(file: File | undefined) {
    if (!file) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: await file.text(),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "تعذّرت الاستعادة");
          return;
        }
        const r = json.result as {
          expenses: number;
          incomes: number;
          categories: number;
          recurring: number;
          debts?: number;
          goals?: number;
        };
        const added = r.expenses + r.incomes + r.categories + r.recurring + (r.debts ?? 0) + (r.goals ?? 0);
        const parts = [
          countExpenses(r.expenses),
          `${r.incomes} دخل`,
          `${r.categories} تصنيف`,
          r.debts ? `${r.debts} دين` : null,
          r.goals ? `${r.goals} هدف` : null,
        ].filter(Boolean);
        toast.success(added === 0 ? "النسخة مستعادة مسبقاً — لا شيء جديد" : `تمت الاستعادة: ${parts.join("، و")}`);
        router.refresh();
      } catch {
        toast.error("تعذّرت قراءة الملف");
      } finally {
        if (input.current) input.current.value = "";
      }
    });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="اختر ملف النسخة الاحتياطية"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <RowButton
        onClick={() => input.current?.click()}
        disabled={pending}
        leading={<RowIcon icon={UploadIcon} />}
        title={
          <span className="flex items-center gap-2">
            استعادة من نسخة
            {pending && <Loader2Icon className="size-4 animate-spin" />}
          </span>
        }
      />
    </>
  );
}

/** Account deletion: last item in Settings, behind a password check. */
export function DeleteAccount() {
  const [password, setPassword] = useState("");
  // Accounts created with Google have no password; null while checking.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    setError(null);
    startTransition(async () => {
      // Without a password Better Auth requires a recent sign-in instead.
      const { error } = await authClient.deleteUser(hasPassword === false ? {} : { password });
      if (error) {
        setError(
          error.code === "INVALID_PASSWORD" || error.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "كلمة المرور غير صحيحة"
            : error.code === "SESSION_EXPIRED"
              ? "لحماية حسابك: سجّل الخروج وادخل من جديد، ثم أعد المحاولة."
              : (error.message ?? "تعذّر حذف الحساب"),
        );
        return;
      }
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      toast.success("تم حذف حسابك وكل بياناتك");
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (open) {
          authClient
            .listAccounts()
            .then(({ data }) => setHasPassword(data ? data.some((a) => a.providerId === "credential") : true));
        } else {
          setPassword("");
          setError(null);
        }
      }}
    >
      <Group footer="يحذف حسابك وكل مصاريفك ودخلك نهائياً. نزّل نسخة أولاً إن أردت الاحتفاظ بها.">
        <AlertDialogTrigger
          render={
            <RowButton
              center
              className="text-destructive"
              title={
                <span className="flex items-center gap-2">
                  <Trash2Icon className="size-[18px]" />
                  حذف الحساب
                </span>
              }
            />
          }
        />
      </Group>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف الحساب نهائياً؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيُحذف حسابك وكل بياناتك ولا يمكن التراجع.
            {hasPassword !== false && " أدخل كلمة المرور للتأكيد."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasPassword !== false && (
          <input
            type="password"
            autoComplete="current-password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            aria-label="كلمة المرور"
            aria-invalid={!!error}
            className="h-11 w-full rounded-[12px] bg-foreground/[0.05] px-3 text-left text-[16px] outline-none ring-1 ring-inset ring-hairline focus:ring-2 focus:ring-ring"
          />
        )}
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={confirm}
            disabled={pending || hasPassword === null || (hasPassword && password.length < 8)}
          >
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            حذف نهائي
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
