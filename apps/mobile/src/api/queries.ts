import { useQuery } from "@tanstack/react-query";

import type {
  Category,
  Dashboard,
  DebtDetails,
  ExpenseList,
  GoalDetails,
  IncomeList,
  Insight,
  Profile,
  RecurringRow,
  Report,
} from "@masrufi/contracts/api/responses";

import { api } from "./client";

export const useProfile = () =>
  useQuery({ queryKey: ["me"], queryFn: () => api.get<Profile>("/me") });

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories") });

export const useDebts = () =>
  useQuery({ queryKey: ["debts"], queryFn: () => api.get<DebtDetails[]>("/debts") });

export const useGoals = () =>
  useQuery({ queryKey: ["goals"], queryFn: () => api.get<GoalDetails[]>("/goals") });

export const useRecurring = () =>
  useQuery({ queryKey: ["recurring"], queryFn: () => api.get<RecurringRow[]>("/recurring") });

export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/dashboard") });

export const useInsights = (month: string) =>
  useQuery({
    queryKey: ["insights", month],
    queryFn: () => api.get<Insight[]>(`/insights?month=${month}`),
    enabled: month !== "",
  });

export const useReport = (month: string) =>
  useQuery({
    queryKey: ["report", month],
    queryFn: () => api.get<Report>(`/reports/monthly?month=${month}`),
  });

type ExpenseFilters = { month: string; q: string; categoryId: string };

export function useExpenses({ month, q, categoryId }: ExpenseFilters, enabled: boolean) {
  const search = q ? `&q=${encodeURIComponent(q)}` : "";
  const category = categoryId ? `&categoryId=${categoryId}` : "";
  return useQuery({
    queryKey: ["expenses", month, q, categoryId],
    queryFn: () => api.get<ExpenseList>(`/expenses?month=${month}${search}${category}`),
    enabled,
  });
}

export const useIncomes = (month: string, enabled: boolean) =>
  useQuery({
    queryKey: ["incomes", month],
    queryFn: () => api.get<IncomeList>(`/incomes?month=${month}`),
    enabled,
  });
