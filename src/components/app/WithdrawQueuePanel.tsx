"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { useVault } from "@/hooks/useVault";
import { useWithdrawQueue, type WithdrawRequestRow } from "@/hooks/useWithdrawQueue";
import { useRole } from "@/hooks/useRole";
import { Panel, PanelHeader, Skeleton, Tag } from "@/components/ui/primitives";
import { formatAmount } from "@/lib/format";

export function WithdrawQueuePanel() {
  const { data: vault } = useVault();
  const queue = useWithdrawQueue();
  const { isCurator } = useRole();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });
  const shareDecimals = vault.shareDecimals ?? 18;

  function act(fn: "cancelWithdraw" | "fulfillWithdraw", id: bigint) {
    if (!VAULT_ADDRESS) return;
    writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: fn, args: [id] });
  }

  const rows = queue.requests;

  return (
    <Panel>
      <PanelHeader
        title="Withdrawal queue"
        hint="Async exits awaiting fulfillment"
        right={
          queue.pendingShares !== undefined ? (
            <span className="num text-xs text-fg-muted">
              {formatAmount(queue.pendingShares, shareDecimals, { maxFractionDigits: 2 })} shares pending
            </span>
          ) : undefined
        }
      />
      {queue.isLoading ? (
        <div className="p-5">
          <Skeleton className="h-20" />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-fg-faint">No pending withdrawal requests.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="dtable min-w-[520px]">
            <thead>
              <tr>
                <th className="pl-5">Request</th>
                <th className="text-right">Shares</th>
                <th>Owner</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <QueueRow
                  key={r.id.toString()}
                  row={r}
                  shareDecimals={shareDecimals}
                  canFulfill={isCurator}
                  busy={isPending || mining}
                  onCancel={() => act("cancelWithdraw", r.id)}
                  onFulfill={() => act("fulfillWithdraw", r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function QueueRow({
  row,
  shareDecimals,
  canFulfill,
  busy,
  onCancel,
  onFulfill,
}: {
  row: WithdrawRequestRow;
  shareDecimals: number;
  canFulfill: boolean;
  busy: boolean;
  onCancel: () => void;
  onFulfill: () => void;
}) {
  return (
    <tr>
      <td className="num pl-5 text-fg">#{row.id.toString()}</td>
      <td className="cell-num text-fg">{formatAmount(row.shares, shareDecimals, { maxFractionDigits: 4 })}</td>
      <td>{row.isMine ? <Tag tone="matcha">yours</Tag> : <span className="text-2xs text-fg-faint">—</span>}</td>
      <td className="pr-5 text-right">
        <div className="flex justify-end gap-2">
          {row.isMine && (
            <button onClick={onCancel} disabled={busy} className="btn-ghost px-3 py-1.5 text-xs">
              Cancel
            </button>
          )}
          {canFulfill && (
            <button
              onClick={onFulfill}
              disabled={busy}
              title="The keeper fulfills withdrawals automatically — this is a manual operator override."
              className="btn-primary px-3 py-1.5 text-xs"
            >
              Fulfill <span className="text-2xs opacity-70">(override)</span>
            </button>
          )}
          {!row.isMine && !canFulfill && <span className="text-2xs text-fg-faint">queued</span>}
        </div>
      </td>
    </tr>
  );
}
