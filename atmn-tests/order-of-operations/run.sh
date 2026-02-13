#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <test-number>"
  exit 1
fi

TEST_NUM="$1"
if [[ ! "$TEST_NUM" =~ ^[0-9]+$ ]]; then
  echo "Invalid test number: $TEST_NUM"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ATMN_CMD="${ATMN_CMD:-bun atmn}"
NUKE_FLAGS="-l --dangerously-skip-all-confirmation-prompts"
PUSH_FLAGS="-l --yes"

BEFORE_CONFIG="$SCRIPT_DIR/before${TEST_NUM}.config.ts"
AFTER_CONFIG="$SCRIPT_DIR/after${TEST_NUM}.config.ts"
SINGLE_CONFIG="$SCRIPT_DIR/test${TEST_NUM}.config.ts"

run_atmn() {
  local step_name="$1"
  local command="$2"

  echo "[$step_name] $command"
  if ! eval "$command"; then
    echo "FAILED: $step_name"
    exit 1
  fi
}

run_push_sequence() {
  local source_config="$1"
  local config_name="$(basename "$source_config")"

  run_atmn "seed: atmn nuke --config ${config_name}" "cd \"$TESTS_DIR\" && $ATMN_CMD nuke $NUKE_FLAGS --config \"order-of-operations/${config_name}\""
  run_atmn "seed: atmn push --config ${config_name}" "cd \"$TESTS_DIR\" && $ATMN_CMD push $PUSH_FLAGS --config \"order-of-operations/${config_name}\""
}

if [[ -f "$BEFORE_CONFIG" && -f "$AFTER_CONFIG" ]]; then
  echo "Running order-of-operations test $TEST_NUM (before/after fixture)"

  run_push_sequence "$BEFORE_CONFIG"

  echo "Applying after state for test $TEST_NUM"
  run_atmn "transition: atmn push --config after${TEST_NUM}.config.ts" "cd \"$TESTS_DIR\" && $ATMN_CMD push $PUSH_FLAGS --config \"order-of-operations/after${TEST_NUM}.config.ts\""
elif [[ -f "$SINGLE_CONFIG" ]]; then
  echo "Running order-of-operations test $TEST_NUM (single fixture)"
  run_push_sequence "$SINGLE_CONFIG"
else
  echo "No matching fixture found for test $TEST_NUM."
  echo "Expected either:"
  echo "  before${TEST_NUM}.config.ts + after${TEST_NUM}.config.ts or"
  echo "  test${TEST_NUM}.config.ts"
  exit 1
fi
