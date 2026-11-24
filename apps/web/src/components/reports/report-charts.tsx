"use client";

import {
  Bar,
  BarChart,
  Cell,
  Label,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
} from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatShortMonth } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";
import type { CategoryTotal } from "@/server/queries";

const barConfig = {
  total: { label: "المصروف", color: "var(--ink)" },
} satisfies ChartConfig;

/** Recessive axes: small muted ink, no lines. */
const TICK = { fill: "var(--muted-foreground)", fontSize: 11 };

/** Glass tooltip: one label + one formatted amount. */
function MoneyTooltip({
  active,
  payload,
  currency,
  labelFor,
}: {
  active?: boolean;
  payload?: { value?: number | string; payload?: Record<string, unknown> }[];
  currency: string;
  labelFor: (row: Record<string, unknown>) => string;
}) {
  const item = payload?.[0];
  if (!active || !item?.payload) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-[12px]">
      <p className="text-muted-foreground">{labelFor(item.payload)}</p>
      <p className="text-[14px] font-semibold tabular" dir="ltr">
        {formatMoney(Number(item.value ?? 0), currency)}
      </p>
    </div>
  );
}

/**
 * Category donut. Slices wear each category's own colour (the same one it
 * has everywhere in the app); the list under the chart is its legend.
 */
export function CategoryDonut({
  items,
  total,
  currency,
}: {
  items: CategoryTotal[];
  total: number;
  currency: string;
}) {
  const config = Object.fromEntries(
    items.map((c, i) => [`c${i}`, { label: c.name, color: c.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-60"
      data-no-swipe
    >
      <PieChart>
        <ChartTooltip
          content={<MoneyTooltip currency={currency} labelFor={(r) => `${r.icon} ${r.name}`} />}
        />
        <Pie
          data={items}
          dataKey="total"
          nameKey="name"
          innerRadius="70%"
          outerRadius="98%"
          paddingAngle={items.length > 1 ? 1.5 : 0}
          cornerRadius={4}
          stroke="var(--card)"
          strokeWidth={2}
          startAngle={90}
          endAngle={-270}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {items.map((c) => (
            <Cell key={c.categoryId ?? "none"} fill={c.color} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={cx} y={cy - 12} className="fill-muted-foreground text-[13px]">
                    الإجمالي
                  </tspan>
                  {/* Exact figure: compact Arabic units reorder badly in SVG. */}
                  <tspan
                    x={cx}
                    y={cy + 13}
                    direction="ltr"
                    className="fill-foreground text-[17px] font-bold"
                  >
                    {formatMoney(total, currency)}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function DailyBars({
  daily,
  average,
  currency,
  today,
}: {
  daily: { day: number; date: string; total: number }[];
  average: number;
  currency: string;
  /** Highlight this date (current month only). */
  today?: string;
}) {
  return (
    <div>
      {average > 0 && (
        <p className="mb-2 flex items-center gap-2 text-[12px] text-muted-foreground">
          <span aria-hidden className="w-4 border-t-2 border-dashed border-muted-foreground/70" />
          المعدّل اليومي
          <span className="font-semibold text-foreground tabular" dir="ltr">
            {formatMoney(average, currency)}
          </span>
        </p>
      )}
      <ChartContainer config={barConfig} className="aspect-[2/1] w-full" data-no-swipe>
        <BarChart data={daily} margin={{ top: 18, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
          {/* No value axis: the tooltip gives exact figures, the dashed line the scale. */}
          {/* RTL: day 1 on the right. */}
          <XAxis
            dataKey="day"
            reversed
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={14}
            tick={TICK}
          />
          <ChartTooltip
            cursor={{ fill: "var(--foreground)", fillOpacity: 0.05, radius: 4 }}
            content={<MoneyTooltip currency={currency} labelFor={(r) => `يوم ${r.day}`} />}
          />
          {average > 0 && (
            <ReferenceLine y={average} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          )}
          <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={14} animationDuration={700}>
            {daily.map((d) => (
              <Cell
                key={d.date}
                // Ink bars; today in the accent so "where am I" reads at a glance.
                fill={d.date === today ? "var(--primary)" : "var(--color-total)"}
                fillOpacity={today && d.date > today ? 0 : today && d.date !== today ? 0.8 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function TrendBars({
  trend,
  month,
  currency,
}: {
  trend: { month: string; total: number }[];
  month: string;
  currency: string;
}) {
  const viewed = trend.find((t) => t.month === month)?.total ?? 0;
  const withData = trend.filter((t) => t.total > 0);
  const avg = withData.length ? withData.reduce((a, t) => a + t.total, 0) / withData.length : 0;
  return (
    <div>
      {/* Direct label for the viewed month, plus the 6-month reference. */}
      <div className="mb-3 flex items-end justify-between gap-3 text-[12px] text-muted-foreground">
        <p>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px] bg-primary" />
            {formatShortMonth(month)}
          </span>
          <span className="block text-[17px] font-bold text-foreground tabular" dir="ltr">
            {formatMoney(viewed, currency)}
          </span>
        </p>
        <p className="text-end">
          متوسط الأشهر
          <span className="block text-[15px] font-semibold text-foreground tabular" dir="ltr">
            {formatMoney(Math.round(avg), currency)}
          </span>
        </p>
      </div>
      <ChartContainer config={barConfig} className="aspect-[2/1] w-full" data-no-swipe>
        <BarChart data={trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            reversed
            tickLine={false}
            axisLine={false}
            tick={TICK}
            tickFormatter={(m: string) => formatShortMonth(m)}
          />
          <ChartTooltip
            cursor={{ fill: "var(--foreground)", fillOpacity: 0.05, radius: 8 }}
            content={
              <MoneyTooltip currency={currency} labelFor={(r) => formatShortMonth(String(r.month))} />
            }
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={36} animationDuration={700}>
            {trend.map((t) => (
              <Cell key={t.month} fill="var(--color-total)" fillOpacity={t.month === month ? 1 : 0.3} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
