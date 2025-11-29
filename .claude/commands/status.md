---
description: Show current implementation status and next tasks
allowed-tools: Read
---

# Status Check

Read `docs/STATUS.md` and display a concise status summary.

## Output Format

Display ONLY this format (no file contents, no extra text):

```
## Current Status

| Milestone              | Status      | Tasks     |
|------------------------|-------------|-----------|
| M1: Tests & Mocks      | COMPLETE    | 4/4 done  |
| M2: EthereumAdapter    | IN PROGRESS | 0/13      |
| M3: SolanaAdapter      | Pending     | 0/11      |
| M4: BaseAdapter        | Pending     | 0/6       |
| M5: Wallet Integration | Pending     | 0/6       |
| M6: Finalization       | Pending     | 0/5       |

**Current Focus**: M2 - EthereumAdapter

**Next Tasks**:
1. Core setup (initialize, disconnect, isConnected)
2. getBalance(), getTokenBalance()
3. getGasPrice(), estimateFees()
```

## Rules

1. Count tasks by counting `- [ ]` (pending) and `- [x]` (done) in STATUS.md
2. Show ONLY the summary table and next 3 tasks
3. DO NOT output file contents or file paths
4. Keep response under 20 lines
