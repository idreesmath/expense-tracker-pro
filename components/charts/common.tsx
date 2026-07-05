"use client";

/** Shared Recharts chrome: recessive axes, hairline grid, ledger tooltip. */

export const AXIS_PROPS = {
  stroke: "var(--chart-axis)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const GRID_PROPS = {
  stroke: "var(--chart-grid)",
  strokeDasharray: "0",
  vertical: false,
} as const;

/** Tooltip wearing text tokens; a colored chip carries series identity. */
export function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  format: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      {label ? <p className="mb-1 text-xs text-muted-foreground">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-2 rounded-[2px]"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ledger-num ms-auto ps-3 font-medium" dir="ltr">
              {format(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
