import { useState } from "react";

import type { Category } from "@masrufi/contracts/api/responses";
import { type DraftExpense, parseCommand } from "@masrufi/core/quick-add/parse";

import { Field } from "@/ui/field";

import { QuickAddList } from "./quick-add-list";

type Props = {
  categories: Category[];
  today: string;
  currency: string;
  onDraft: (draft: DraftExpense) => void;
  onDone: () => void;
};

/** "قهوة 5 بطاقة مبارح" fills the form; several amounts become a list to confirm. */
export function QuickAdd({ categories, today, currency, onDraft, onDone }: Props) {
  const [sentence, setSentence] = useState("");
  const [drafts, setDrafts] = useState<DraftExpense[]>([]);

  function read(text: string) {
    setSentence(text);
    const command = parseCommand(text, { today, categories });
    const items = command.kind === "add" ? command.items : [];
    setDrafts(items.length > 1 ? items : []);
    if (items.length === 1) onDraft(items[0]);
  }

  return (
    <>
      <Field label="إدخال سريع" value={sentence} onChangeText={read} placeholder="قهوة 5 بطاقة مبارح" />
      {drafts.length > 0 ? (
        <QuickAddList drafts={drafts} categories={categories} currency={currency} onDone={onDone} />
      ) : null}
    </>
  );
}
