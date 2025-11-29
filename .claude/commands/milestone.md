---
description: Start or continue work on a specific milestone
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
argument-hint: "<milestone-number>"
---

# Milestone Executor

Execute a specific milestone from the implementation plan.

## Your Task

Work on Milestone $ARGUMENTS

## Protocol

1. **Load Context**
   - Read `docs/STATUS.md` for current progress
   - Read `docs/milestones/M$ARGUMENTS_*.md` for detailed tasks
   - Read reference files mentioned in the milestone doc

2. **Execute Tasks**
   - Work through each unchecked `[ ]` task in order
   - Follow the code examples provided in the milestone doc
   - Run tests after each implementation

3. **Track Progress**
   - Update `docs/STATUS.md` checkboxes as you complete tasks
   - Use TodoWrite to track your progress during the session

4. **Validate**
   - Run `npm test` to ensure all tests pass
   - Run `npx tsc --noEmit` to check for TypeScript errors

## Reference Files

For any milestone, always check:
- `src/blockchain/adapters/HederaAdapter.ts` - Implementation pattern
- `tests/mocks/hedera-sdk.mock.ts` - Mock pattern
- `src/blockchain/core/types.ts` - Type definitions

Now read the milestone file and begin implementation.
