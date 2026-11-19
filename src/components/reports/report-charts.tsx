"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { formatShortMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CategoryTotal } from "@/server/queries";

const barConfig = {
  total: { label: "المصروف", color: "var(--primary)" },
} satisfies ChartConfig;

/** Minimal tooltip: one label + one formatted amount. */
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
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">{labelFor(item.payload)}</p>
      <p className="font-semibold tabular" dir="ltr">
        {formatMoney(Number(item.value ?? 0), currency)}
      </p>
    </div>
  );
}

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
    <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
      <PieChart>
        <ChartTooltip
          content={
            <MoneyTooltip
              currency={currency}
              labelFor={(r) => `${r.icon} ${r.name}`}
            />
          }
        />
        <Pie
          data={items}
          dataKey="total"
          nameKey="name"
          innerRadius="62%"
          outerRadius="95%"
          paddingAngle={items.length > 1 ? 2 : 0}
          cornerRadius={6}
          strokeWidth={0}
          isAnimationActive
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
                  <tspan x={cx} y={cy - 10} className="fill-muted-foreground text-xs">
                    الإجمالي
                  </tspan>
                  <tspan
                    x={cx}
                    y={cy + 14}
                    className="fill-foreground text-lg font-bold"
                  >
                    {formatMoney(total, currency, { compact: true })}
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
}: {
  daily: { day: number; date: string; total: number }[];
  average: number;
  currency: string;
}) {
  return (
    <ChartContainer config={barConfig} className="aspect-[2/1] w-full">
      <BarChart data={daily} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        {/* RTL: day 1 on the right. */}
        <XAxis
          dataKey="day"
          reversed
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={12}
          fontSize={11}
        />
        <YAxis
          orientation="right"
          width={44}
          tickLine={false}
          axisLine={false}
          fontSize={10}
          tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <MoneyTooltip currency={currency} labelFor={(r) => `يوم ${r.day}`} />
          }
        />
        {average > 0 && (
          <ReferenceLine
            y={average}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
        )}
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
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
  return (
    <ChartContainer config={barConfig} className="aspect-[2/1] w-full">
      <BarChart data={trend} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="month"
          reversed
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(m: string) => formatShortMonth(m)}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <MoneyTooltip
              currency={currency}
              labelFor={(r) => formatShortMonth(String(r.month))}
            />
          }
        />
        <Bar
          dataKey="total"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
          label={{
            position: "top",
            fontSize: 10,
            className: "fill-muted-foreground",
            formatter: (v: unknown) =>
              Number(v) > 0 ? formatMoney(Number(v), currency, { compact: true }) : "",
          }}
        >
          {trend.map((t) => (
            <Cell
              key={t.month}
              fill="var(--color-total)"
              fillOpacity={t.month === month ? 1 : 0.35}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
