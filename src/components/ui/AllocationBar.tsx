import type { StrategyRow } from "@/hooks/useAllocations";
import { bpsToPct } from "@/lib/format";

/**
 * 100%-stacked allocation bar + legend. Bar widths use live capital fractions;
 * the target (bps) is shown alongside so drift is visible. Solid surface (no
 * glass) — this is data, and contrast must stay stable.
 */
export function AllocationBar({ rows, mode = "live" }: { rows: StrategyRow[]; mode?: "live" | "target" }) {
  const segments = rows
    .map((r) => ({ row: r, width: mode === "live" ? r.liveFraction : (r.targetBps ?? 0) / 10_000 }))
    .filter((s) => s.width > 0.0005);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3 ring-1 ring-inset ring-line">
        {segments.map(({ row, width }) => (
          <div
            key={row.id}
            className="h-full transition-all duration-500"
            style={{ width: `${width * 100}%`, backgroundColor: row.meta.color }}
            title={`${row.meta.label} — ${(width * 100).toFixed(1)}%`}
          />
        ))}
        {segments.length === 0 && <div className="h-full w-full bg-surface-3" />}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: r.meta.color }} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium text-fg">{r.meta.label}</span>
                {r.quarantined && <span className="text-2xs font-semibold uppercase text-down">QTN</span>}
              </div>
              <div className="num text-sm text-fg">{(r.liveFraction * 100).toFixed(1)}%</div>
              <div className="text-2xs text-fg-faint">target {bpsToPct(r.targetBps)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
