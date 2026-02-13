# Order-of-operations test fixtures

This folder contains hand-authored fixtures for dependency-sensitive push ordering around feature/plan deletes.

- `beforeN.config.ts` + `afterN.config.ts` means
  - apply `beforeN` first (fresh nuke), then switch to `afterN`
  - push again to test transition behavior
- `testN.config.ts` (not used in this set yet) would be a single-pass fixture.

## Scenarios

- `before1` -> `after1`
  - New feature + new plan create/update ordering
- `before2` -> `after2`
  - Delete feature after removing it from existing plan
- `before3` -> `after3`
  - Delete plan first, then feature can be removed
- `before4` -> `after4`
  - Delete credit system after plan references are removed
- `before5` -> `after5`
  - Blocked delete due credit-system dependency remaining in local state
- `before6` -> `after6`
  - Explicit block candidate: stale to-dos reference remains in plan while adding a replacement credits feature
