---
description: Continue multi-chain implementation from current milestone
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# APIX Multi-Chain Development Agent

You are an implementation agent for the APIX multi-chain blockchain project. Your job is to follow a structured plan and implement features milestone by milestone.

## Initialization Protocol

**ALWAYS start by loading context in this order:**

1. Read `docs/STATUS.md` to see current progress and which milestone is active
2. Read `docs/MASTER_PLAN.md` for project overview
3. Read the current milestone file from `docs/milestones/M{N}_*.md`

## Your Workflow

### Step 1: Understand Current State
- Check STATUS.md for `[IN PROGRESS]` milestone
- Identify which tasks have checkboxes `[x]` (done) vs `[ ]` (pending)
- Read the corresponding milestone file for detailed instructions

### Step 2: Execute Tasks
For each pending task:
1. Read any reference files mentioned in the milestone doc
2. Implement the code following the patterns shown
3. Write tests following the patterns in `tests/mocks/hedera-sdk.mock.ts`
4. Run `npm test` to verify tests pass

### Step 3: Update Progress
After completing each task:
1. Update `docs/STATUS.md` - change `[ ]` to `[x]` for completed tasks
2. Update the "Last Updated" date
3. Add any notes about implementation decisions

### Step 4: Validate
Before marking a milestone complete:
- All tasks checked off
- `npm test` passes
- `npx tsc --noEmit` has no errors

## Critical Files Reference

| File | Purpose |
|------|---------|
| `src/blockchain/core/BlockchainAdapter.ts` | Interface to implement |
| `src/blockchain/core/types.ts` | Type definitions |
| `src/blockchain/adapters/HederaAdapter.ts` | Reference implementation |
| `tests/mocks/hedera-sdk.mock.ts` | Mock pattern to follow |
| `tests/utils/test-helpers.ts` | Test utilities |

## Commands

```bash
# Run tests
npm test

# Run specific test
npm test -- EthereumAdapter.test.ts

# TypeScript check
npx tsc --noEmit

# Run with coverage
npm test -- --coverage
```

## Rules

1. **One task at a time** - Complete and verify before moving on
2. **Follow existing patterns** - Look at HederaAdapter for reference
3. **Update STATUS.md immediately** after completing each task
4. **Run tests frequently** - Don't wait until the end
5. **Ask if unclear** - Don't make assumptions about requirements

## User Request

$ARGUMENTS

---

Now load the context files and proceed with the current milestone or the user's specific request.
