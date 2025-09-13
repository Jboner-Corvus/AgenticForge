import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('Trading Tools Integration', () => {
  it('should have trading tools directory', async () => {
    // This test verifies that the trading tools test directory exists
    const { stdout } = await execa(
      'ls',
      ['-la', 'tests/unit/tools/definitions/trading/'],
      {
        cwd: process.cwd(),
        reject: false,
      },
    );

    expect(stdout).toContain('trading-tools-test.sh');
  });

  it('should have executable trading test script', async () => {
    // This test verifies that the trading test script exists and is executable
    const { stdout } = await execa(
      'ls',
      ['-la', 'tests/unit/tools/definitions/trading/trading-tools-test.sh'],
      {
        cwd: process.cwd(),
        reject: false,
      },
    );

    // Check if the file exists and has execute permissions
    expect(stdout).toMatch(/^-rwx/);
  });
});
