import type { CreateContribution, CreateGoal, SaveGoal } from "@masrufi/contracts/api/plans";
import { todayISO } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";
import { goalState } from "@masrufi/core/plans";

import { conflict, notFound, ruleBroken } from "../lib/errors";
import type { Models, Store } from "../models";
import type { Contribution } from "../models/goal-contribution.model";
import type { Goal } from "../models/goal.model";
import type { User } from "../models/user.model";

const MISSING = "الهدف غير موجود";

function describe(goal: Goal, contributions: Contribution[], user: User) {
  const saved = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  const start = todayISO(user.timezone, goal.createdAt);
  const state = goalState({ ...goal, saved, start }, todayISO(user.timezone));
  return { goal, contributions, saved, state };
}

export type GoalDetails = ReturnType<typeof describe>;

export class GoalService {
  constructor(private readonly store: Store) {}

  /** Goals still in progress first. */
  async list(user: User): Promise<GoalDetails[]> {
    const [goals, contributions] = await Promise.all([
      this.store.goals.list(user.id),
      this.store.contributions.list(user.id),
    ]);
    const contributionsOf = Map.groupBy(contributions, (contribution) => contribution.goalId);
    return goals
      .map((goal) => describe(goal, contributionsOf.get(goal.id) ?? [], user))
      .sort((a, b) => Number(a.state.achieved) - Number(b.state.achieved));
  }

  create(user: User, { initial, ...input }: CreateGoal): Promise<Goal> {
    return this.store.transaction(async (models) => {
      const goal = await models.goals.insert({ ...input, userId: user.id });
      if (!goal) return this.alreadyCreated(models, user, input.id);
      if (!initial) return goal;
      await models.contributions.insert({
        goalId: goal.id,
        userId: user.id,
        amount: initial,
        date: todayISO(user.timezone),
        note: "رصيد البداية",
      });
      return this.markAchieved(models, goal);
    });
  }

  update(user: User, id: string, input: SaveGoal): Promise<Goal> {
    return this.store.transaction(async (models) => {
      const updated = await models.goals.update(user.id, id, input);
      if (!updated) throw notFound(MISSING);
      return this.markAchieved(models, updated);
    });
  }

  async delete(user: User, id: string): Promise<void> {
    await this.store.transaction(async (models) => {
      if (!(await models.goals.delete(user.id, id))) throw notFound(MISSING);
      await models.contributions.deleteAll(user.id, id);
    });
  }

  addContribution(user: User, goalId: string, input: CreateContribution): Promise<Goal> {
    const { kind, ...fields } = input;
    return this.store.transaction(async (models) => {
      const goal = await this.locked(models, user, goalId);
      if (input.id && (await this.isRepeated(models, goal, input.id))) return goal;

      if (kind === "withdraw") await this.assertEnoughSaved(models, goal, input.amount);
      const amount = kind === "withdraw" ? -input.amount : input.amount;
      const row = { ...fields, amount, goalId, userId: user.id };
      if (!(await models.contributions.insert(row))) throw conflict("المعرّف مستخدم من قبل");
      return this.markAchieved(models, goal);
    });
  }

  async deleteContribution(user: User, goalId: string, id: string): Promise<void> {
    await this.store.transaction(async (models) => {
      const goal = await this.locked(models, user, goalId);
      if (!(await models.contributions.delete(user.id, goalId, id))) {
        throw notFound("المبلغ غير موجود");
      }
      // Removing a deposit must not leave more taken out than was put in.
      await this.assertEnoughSaved(models, goal, 0);
    });
  }

  private async locked(models: Models, user: User, id: string): Promise<Goal> {
    const goal = await models.goals.lock(user.id, id);
    if (!goal) throw notFound(MISSING);
    return goal;
  }

  private async isRepeated(models: Models, goal: Goal, contributionId: string): Promise<boolean> {
    const existing = await models.contributions.find(goal.userId, contributionId);
    return existing?.goalId === goal.id;
  }

  private async assertEnoughSaved(models: Models, goal: Goal, withdrawal: number) {
    const saved = await models.contributions.totalSaved(goal.userId, goal.id);
    if (withdrawal <= saved) return;
    const available = formatMoney(Math.max(0, saved), goal.currency);
    throw ruleBroken(`لا يمكن سحب أكثر من المدّخر (${available})`, "amount");
  }

  /** Stamps the first time the target is reached. */
  private async markAchieved(models: Models, goal: Goal): Promise<Goal> {
    if (goal.achievedAt) return goal;
    const saved = await models.contributions.totalSaved(goal.userId, goal.id);
    if (saved < goal.target) return goal;
    return (await models.goals.update(goal.userId, goal.id, { achievedAt: new Date() }))!;
  }

  private async alreadyCreated(models: Models, user: User, id = ""): Promise<Goal> {
    const existing = await models.goals.find(user.id, id);
    if (!existing) throw conflict("المعرّف مستخدم من قبل");
    return existing;
  }
}
