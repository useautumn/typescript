import { describe, test, expect, afterEach } from 'bun:test';
import { render, cleanup, waitFor } from 'cli-testing-library';
import { CLI_PATH, spawnOpts } from './setup';

// Quote the CLI_PATH for shell execution (cli-testing-library uses shell: true)
const QUOTED_CLI_PATH = `"${CLI_PATH}"`;

describe('env command', () => {
  afterEach(async () => {
    await cleanup();
  });

  test('shows environment type', async () => {
    const instance = await render('node', [QUOTED_CLI_PATH, 'env'], {
      spawnOpts,
    });

    // Wait for process to exit
    await waitFor(() => {
      const exit = instance.hasExit();
      expect(exit).toBeTruthy();
    }, { timeout: 10000 });

    // Should show either Sandbox or Production
    const stdout = instance.stdoutArr.map(s => s.contents.toString()).join('');
    expect(stdout).toMatch(/Environment:/i);
  });
});
