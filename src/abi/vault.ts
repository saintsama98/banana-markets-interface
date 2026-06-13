/**
 * Consolidated ABI for the Vault Router diamond (EIP-2535).
 *
 * Hand-authored from the verified on-chain surface of
 *   /mnt/adiii_dev/Ethereum-dev/vault-router-diamond (branch `main`).
 * Because a diamond presents one address with many facets, every selector the UI
 * touches is flattened into this single ABI — exactly how viem/wagmi expect it.
 *
 * TODO(post-deploy): regenerate from Foundry artifacts for full fidelity, e.g.
 *   `forge inspect Vault abi` plus each *Facet, merged. This curated subset covers
 *   everything the current UI reads/writes.
 */
export const vaultAbi = [
  // ---------------------------------------------------------------- ERC-20 (shares)
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }] },

  // ---------------------------------------------------------------- ERC-4626
  { type: "function", name: "asset", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "totalAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "convertToShares", stateMutability: "view", inputs: [{ name: "assets", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "convertToAssets", stateMutability: "view", inputs: [{ name: "shares", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "previewDeposit", stateMutability: "view", inputs: [{ name: "assets", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "previewRedeem", stateMutability: "view", inputs: [{ name: "shares", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "maxWithdraw", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "maxRedeem", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }], outputs: [{ name: "shares", type: "uint256" }] },
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "shares", type: "uint256" }, { name: "receiver", type: "address" }], outputs: [{ name: "assets", type: "uint256" }] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }, { name: "owner", type: "address" }], outputs: [{ name: "shares", type: "uint256" }] },
  { type: "function", name: "redeem", stateMutability: "nonpayable", inputs: [{ name: "shares", type: "uint256" }, { name: "receiver", type: "address" }, { name: "owner", type: "address" }], outputs: [{ name: "assets", type: "uint256" }] },

  // ---------------------------------------------------------------- Async withdrawal queue
  { type: "function", name: "requestWithdraw", stateMutability: "nonpayable", inputs: [{ name: "shares", type: "uint256" }, { name: "receiver", type: "address" }], outputs: [{ name: "id", type: "uint256" }] },
  { type: "function", name: "cancelWithdraw", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { type: "function", name: "fulfillWithdraw", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { type: "function", name: "nextWithdrawRequestId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pendingWithdrawShares", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "withdrawRequest",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "receiver", type: "address" },
          { name: "shares", type: "uint256" },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Allocator (curator + owner)
  { type: "function", name: "strategies", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32[]" }] },
  { type: "function", name: "targetAllocation", stateMutability: "view", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [{ type: "uint16" }] },
  { type: "function", name: "strategyTotalAssets", stateMutability: "view", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "idleAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "idleReserveBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "strategyCap", stateMutability: "view", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [{ type: "uint16" }] },
  { type: "function", name: "globalStrategyCap", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "lastRebalanceBlock", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "maxRebalanceDelta", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "isQuarantined", stateMutability: "view", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "setAllocation", stateMutability: "nonpayable", inputs: [{ name: "strategyIds", type: "bytes32[]" }, { name: "bps", type: "uint16[]" }], outputs: [] },
  { type: "function", name: "rebalance", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "setIdleReserve", stateMutability: "nonpayable", inputs: [{ name: "bps", type: "uint16" }], outputs: [] },
  { type: "function", name: "setStrategyCap", stateMutability: "nonpayable", inputs: [{ name: "strategyId", type: "bytes32" }, { name: "capBps", type: "uint16" }], outputs: [] },
  { type: "function", name: "setGlobalStrategyCap", stateMutability: "nonpayable", inputs: [{ name: "capBps", type: "uint16" }], outputs: [] },
  { type: "function", name: "quarantineStrategy", stateMutability: "nonpayable", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [] },
  { type: "function", name: "releaseStrategy", stateMutability: "nonpayable", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [] },

  // ---------------------------------------------------------------- Harvest (curator)
  { type: "function", name: "harvest", stateMutability: "nonpayable", inputs: [{ name: "strategyId", type: "bytes32" }], outputs: [] },
  { type: "function", name: "harvestAll", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // ---------------------------------------------------------------- Fees (owner)
  { type: "function", name: "feeRecipient", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "performanceFeeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "managementFeeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "highWaterMark", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "lastFeeAccrual", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "setFeeRecipient", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }], outputs: [] },
  { type: "function", name: "setPerformanceFee", stateMutability: "nonpayable", inputs: [{ name: "bps", type: "uint16" }], outputs: [] },
  { type: "function", name: "setManagementFee", stateMutability: "nonpayable", inputs: [{ name: "bps", type: "uint16" }], outputs: [] },

  // ---------------------------------------------------------------- Guard / circuit breaker
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "maxSharePriceDeltaBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
  { type: "function", name: "lastSharePrice", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "setMaxSharePriceDelta", stateMutability: "nonpayable", inputs: [{ name: "bps", type: "uint16" }], outputs: [] },
  { type: "function", name: "guardCheckpoint", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // ---------------------------------------------------------------- Share lock
  { type: "function", name: "shareLockPeriod", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "lockedUntil", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "setShareLockPeriod", stateMutability: "nonpayable", inputs: [{ name: "period", type: "uint64" }], outputs: [] },

  // ---------------------------------------------------------------- Roles
  { type: "function", name: "isCurator", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "setCurator", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }, { name: "enabled", type: "bool" }], outputs: [] },

  // ---------------------------------------------------------------- Ownership (ERC-173, two-step)
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "pendingOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "transferOwnership", stateMutability: "nonpayable", inputs: [{ name: "newOwner", type: "address" }], outputs: [] },
  { type: "function", name: "acceptOwnership", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // ---------------------------------------------------------------- Events (activity feed)
  { type: "event", name: "Deposit", inputs: [{ name: "caller", type: "address", indexed: true }, { name: "owner", type: "address", indexed: true }, { name: "assets", type: "uint256", indexed: false }, { name: "shares", type: "uint256", indexed: false }] },
  { type: "event", name: "Withdraw", inputs: [{ name: "caller", type: "address", indexed: true }, { name: "receiver", type: "address", indexed: true }, { name: "owner", type: "address", indexed: true }, { name: "assets", type: "uint256", indexed: false }, { name: "shares", type: "uint256", indexed: false }] },
  { type: "event", name: "WithdrawRequested", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "owner", type: "address", indexed: true }, { name: "receiver", type: "address", indexed: true }, { name: "shares", type: "uint256", indexed: false }] },
  { type: "event", name: "WithdrawCancelled", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "owner", type: "address", indexed: true }, { name: "shares", type: "uint256", indexed: false }] },
  { type: "event", name: "WithdrawFulfilled", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "receiver", type: "address", indexed: true }, { name: "shares", type: "uint256", indexed: false }, { name: "assets", type: "uint256", indexed: false }] },
  { type: "event", name: "Rebalanced", inputs: [{ name: "totalAssets", type: "uint256", indexed: false }, { name: "idleAfter", type: "uint256", indexed: false }] },
  { type: "event", name: "AllocationSet", inputs: [{ name: "strategyIds", type: "bytes32[]", indexed: false }, { name: "bps", type: "uint16[]", indexed: false }] },
  { type: "event", name: "StrategyQuarantined", inputs: [{ name: "strategyId", type: "bytes32", indexed: true }] },
  { type: "event", name: "StrategyHarvested", inputs: [{ name: "strategyId", type: "bytes32", indexed: true }] },
  { type: "event", name: "Paused", inputs: [{ name: "by", type: "address", indexed: true }] },
  { type: "event", name: "Unpaused", inputs: [{ name: "by", type: "address", indexed: true }, { name: "baseline", type: "uint256", indexed: false }] },
  { type: "event", name: "CuratorSet", inputs: [{ name: "account", type: "address", indexed: true }, { name: "enabled", type: "bool", indexed: false }] },
] as const;

/** Minimal ERC-20 ABI for the underlying asset (USDC) — approvals & balances. */
export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
