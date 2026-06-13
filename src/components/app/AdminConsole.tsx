"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, type Hex } from "viem";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { useVault } from "@/hooks/useVault";
import { useRole } from "@/hooks/useRole";
import { useAllocations } from "@/hooks/useAllocations";
import { Panel, PanelHeader, Stat, StatusDot, Skeleton } from "@/components/ui/primitives";
import { bpsToPct, shortAddress, formatUsd } from "@/lib/format";
import { resolveStrategy } from "@/lib/strategies";

export function AdminConsole() {
  const { data: vault, isLoading } = useVault();
  const { owner } = useRole();
  const { rows: strategies, isLoading: strategiesLoading } = useAllocations();

  const { writeContract, data: hash, isPending, variables } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || mining;

  function write(functionName: string, args: readonly unknown[]) {
    if (!VAULT_ADDRESS) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: functionName as any, args: args as any });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Panel>
        <PanelHeader
          title="Circuit breaker"
          hint="Emergency pause + share-price guard"
          right={<StatusDot tone={vault.paused ? "negative" : "positive"} label={vault.paused ? "Paused" : "Active"} />}
        />
        <div className="space-y-4 px-5 py-5">
          {isLoading ? (
            <Skeleton className="h-12" />
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Max share-price Δ" value={bpsToPct(vault.maxSharePriceDeltaBps)} />
              <Stat label="State" value={vault.paused ? "Halted" : "Open"} accent={vault.paused ? "negative" : "positive"} mono={false} />
            </div>
          )}
          <div className="flex gap-3">
            {vault.paused ? (
              <button onClick={() => write("unpause", [])} disabled={busy} className="btn-primary">
                {busy && variables?.functionName === "unpause" ? "Unpausing…" : "Unpause vault"}
              </button>
            ) : (
              <button onClick={() => write("pause", [])} disabled={busy} className="btn-punch">
                {busy && variables?.functionName === "pause" ? "Pausing…" : "Pause vault"}
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Fees" hint="Performance & management" />
        <div className="space-y-4 px-5 py-5">
          {isLoading ? (
            <Skeleton className="h-12" />
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Performance" value={bpsToPct(vault.performanceFeeBps, 0)} />
              <Stat label="Management" value={bpsToPct(vault.managementFeeBps, 0)} sub="annual" />
            </div>
          )}
          <div className="text-xs text-fg-muted">
            Recipient: <span className="num-mono text-fg">{shortAddress(vault.feeRecipient)}</span>
          </div>
          <BpsEditor label="Set performance fee" unit="%" max={50} disabled={busy} onSubmit={(pct) => write("setPerformanceFee", [Math.round(pct * 100)])} />
          <BpsEditor label="Set management fee" unit="%" max={10} disabled={busy} onSubmit={(pct) => write("setManagementFee", [Math.round(pct * 100)])} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Risk bounds" hint="Caps & idle reserve" />
        <div className="space-y-4 px-5 py-5">
          {isLoading ? (
            <Skeleton className="h-12" />
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Global strategy cap" value={bpsToPct(vault.globalStrategyCap, 0)} />
              <Stat label="Idle reserve floor" value={bpsToPct(vault.idleReserveBps, 0)} />
            </div>
          )}
          <BpsEditor label="Set global strategy cap" unit="%" max={100} disabled={busy} onSubmit={(pct) => write("setGlobalStrategyCap", [Math.round(pct * 100)])} />
          <BpsEditor label="Set idle reserve" unit="%" max={100} disabled={busy} onSubmit={(pct) => write("setIdleReserve", [Math.round(pct * 100)])} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Ownership" hint="Two-step transfer (ERC-173)" />
        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Owner</span>
              <span className="num-mono text-fg">{shortAddress(owner)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Vault idle</span>
              <span className="num text-fg">{formatUsd(vault.idleAssets, vault.assetDecimals)}</span>
            </div>
          </div>
          <AddressEditor label="Transfer ownership" disabled={busy} onSubmit={(addr) => write("transferOwnership", [addr])} />
          <p className="text-2xs text-fg-faint">
            Transfer nominates a pending owner; the new owner must call acceptOwnership to complete.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Curator" hint="Authorize / rotate the keeper key" />
        <div className="space-y-4 px-5 py-5">
          <p className="text-xs text-fg-muted">
            Grant or revoke the off-chain curator (keeper) authorization. Rotate by revoking the old key and granting the new one.
          </p>
          <CuratorEditor disabled={busy} onSubmit={(addr, allowed) => write("setCurator", [addr, allowed])} />
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <PanelHeader title="Strategy controls" hint="Circuit breaker & per-strategy caps" />
        <div className="space-y-5 px-5 py-5">
          {strategiesLoading ? (
            <Skeleton className="h-12" />
          ) : strategies.length === 0 ? (
            <p className="text-xs text-fg-muted">No strategies registered.</p>
          ) : (
            <StrategyControls
              strategies={strategies.map((s) => ({ id: s.id, capBps: s.capBps, quarantined: s.quarantined }))}
              disabled={busy}
              onQuarantine={(id) => write("quarantineStrategy", [id])}
              onRelease={(id) => write("releaseStrategy", [id])}
              onSetCap={(id, pct) => write("setStrategyCap", [id, Math.round(pct * 100)])}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}

function CuratorEditor({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (addr: `0x${string}`, allowed: boolean) => void;
}) {
  const [v, setV] = useState("");
  const valid = isAddress(v);
  return (
    <div>
      <div className="overline mb-1.5">Curator address</div>
      <div className="flex gap-2">
        <input
          placeholder="0x…"
          value={v}
          onChange={(e) => setV(e.target.value.trim())}
          className="num-mono flex-1 rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-accent-strong placeholder:text-fg-faint"
        />
        <button
          onClick={() => { if (valid) onSubmit(v as `0x${string}`, true); }}
          disabled={disabled || !valid}
          className="btn-ghost px-4"
        >
          Grant
        </button>
        <button
          onClick={() => { if (valid) onSubmit(v as `0x${string}`, false); }}
          disabled={disabled || !valid}
          className="btn-ghost px-4"
        >
          Revoke
        </button>
      </div>
    </div>
  );
}

function StrategyControls({
  strategies,
  disabled,
  onQuarantine,
  onRelease,
  onSetCap,
}: {
  strategies: { id: Hex; capBps?: number; quarantined?: boolean }[];
  disabled?: boolean;
  onQuarantine: (id: Hex) => void;
  onRelease: (id: Hex) => void;
  onSetCap: (id: Hex, pct: number) => void;
}) {
  const [selected, setSelected] = useState<Hex>(strategies[0]?.id);
  const active = strategies.find((s) => s.id === selected) ?? strategies[0];
  const [cap, setCap] = useState("");
  const capNum = Number(cap);
  const capInvalid = cap === "" || Number.isNaN(capNum) || capNum < 0 || capNum > 100;

  if (!active) return null;
  const meta = resolveStrategy(active.id);

  return (
    <div className="space-y-4">
      <div>
        <div className="overline mb-1.5">Strategy</div>
        <div className="flex flex-wrap gap-2">
          {strategies.map((s) => {
            const m = resolveStrategy(s.id);
            const on = s.id === active.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`btn-ghost px-3 ${on ? "border-accent-strong text-fg" : "text-fg-muted"}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Stat label="Current cap" value={active.capBps != null ? bpsToPct(active.capBps, 0) : "—"} />
        <Stat
          label="State"
          value={active.quarantined ? "Quarantined" : "Active"}
          accent={active.quarantined ? "negative" : "positive"}
          mono={false}
        />
      </div>

      <div>
        <div className="overline mb-1.5">Circuit breaker — {meta.label}</div>
        <div className="flex gap-3">
          {active.quarantined ? (
            <button onClick={() => onRelease(active.id)} disabled={disabled} className="btn-primary">
              Release
            </button>
          ) : (
            <button onClick={() => onQuarantine(active.id)} disabled={disabled} className="btn-punch">
              Quarantine
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="overline mb-1.5">Set cap — {meta.label}</div>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border-2 border-ink bg-canvas px-3 py-2 focus-within:border-accent-strong">
            <input
              inputMode="decimal"
              placeholder="0 – 100"
              value={cap}
              onChange={(e) => setCap(e.target.value.replace(/[^0-9.]/g, ""))}
              className="num w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
            />
            <span className="text-xs text-fg-muted">%</span>
          </div>
          <button
            onClick={() => { if (!capInvalid) onSetCap(active.id, capNum); }}
            disabled={disabled || capInvalid}
            className="btn-ghost px-4"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}

function BpsEditor({
  label,
  unit,
  max,
  disabled,
  onSubmit,
}: {
  label: string;
  unit: string;
  max: number;
  disabled?: boolean;
  onSubmit: (value: number) => void;
}) {
  const [v, setV] = useState("");
  const num = Number(v);
  const invalid = v === "" || Number.isNaN(num) || num < 0 || num > max;
  return (
    <div>
      <div className="overline mb-1.5">{label}</div>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border-2 border-ink bg-canvas px-3 py-2 focus-within:border-accent-strong">
          <input
            inputMode="decimal"
            placeholder={`0 – ${max}`}
            value={v}
            onChange={(e) => setV(e.target.value.replace(/[^0-9.]/g, ""))}
            className="num w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
          />
          <span className="text-xs text-fg-muted">{unit}</span>
        </div>
        <button onClick={() => { if (!invalid) onSubmit(num); }} disabled={disabled || invalid} className="btn-ghost px-4">
          Set
        </button>
      </div>
    </div>
  );
}

function AddressEditor({
  label,
  disabled,
  onSubmit,
}: {
  label: string;
  disabled?: boolean;
  onSubmit: (addr: `0x${string}`) => void;
}) {
  const [v, setV] = useState("");
  const valid = isAddress(v);
  return (
    <div>
      <div className="overline mb-1.5">{label}</div>
      <div className="flex gap-2">
        <input
          placeholder="0x…"
          value={v}
          onChange={(e) => setV(e.target.value.trim())}
          className="num-mono flex-1 rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-accent-strong placeholder:text-fg-faint"
        />
        <button onClick={() => { if (valid) onSubmit(v as `0x${string}`); }} disabled={disabled || !valid} className="btn-ghost px-4">
          Transfer
        </button>
      </div>
    </div>
  );
}
