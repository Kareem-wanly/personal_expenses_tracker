import type { ComponentType } from "react";

import { CategoryForm } from "@/features/categories/category-form";
import { DebtForm } from "@/features/debts/debt-form";
import { DebtSheet } from "@/features/debts/debt-sheet";
import { GoalForm } from "@/features/goals/goal-form";
import { GoalSheet } from "@/features/goals/goal-sheet";
import { LockSetup } from "@/features/lock/lock-setup";
import { RecurringForm } from "@/features/recurring/recurring-form";
import { DeleteAccount } from "@/features/settings/delete-account";
import { PasswordForm } from "@/features/settings/password-form";
import { ProfileForm } from "@/features/settings/profile-form";
import { WhatsNew } from "@/features/whats-new/whats-new";

export type SheetProps = { close: () => void };

export const sheets = {
  category: CategoryForm,
  "debt-form": DebtForm,
  debt: DebtSheet,
  "goal-form": GoalForm,
  goal: GoalSheet,
  lock: LockSetup,
  recurring: RecurringForm,
  "delete-account": DeleteAccount,
  password: PasswordForm,
  profile: ProfileForm,
  "whats-new": WhatsNew,
} satisfies Record<string, ComponentType<SheetProps>>;

export type SheetName = keyof typeof sheets;
