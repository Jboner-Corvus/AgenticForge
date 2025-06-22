// src/utils/qualityGate.ts
import { runInSandbox } from './dockerManager.js';
import logger from '../logger.js';

const DEV_SANDBOX_IMAGE = 'node:20-alpine';
const mountPoint = {
  Type: 'bind' as const,
  Source: process.cwd(),
  Target: '/usr/src/app',
};

interface QualityResult {
  success: boolean;
  output: string;
}

/**
 * Exécute une série de vérifications de qualité (types, format, lint) dans un sandbox Docker.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
export async function runQualityGate(): Promise<QualityResult> {
  const outputMessages: string[] = [];
  let allChecksPassed = true;

  const checks = [
    { name: 'Lint (Fix)', command: ['pnpm', 'run', 'lint:fix'] },
    { name: 'Format', command: ['pnpm', 'run', 'format'] },
    { name: 'Type Check', command: ['pnpm', 'exec', 'tsc', '--noEmit'] },
  ];

  for (const check of checks) {
    logger.info(`Running quality check: ${check.name}...`);
    outputMessages.push(`--- Running: ${check.name} ---`);

    const result = await runInSandbox(DEV_SANDBOX_IMAGE, check.command, {
      workingDir: '/usr/src/app',
      mounts: [mountPoint],
    });

    outputMessages.push(`Exit Code: ${result.exitCode}`);
    if (result.stdout) outputMessages.push(`STDOUT:\n${result.stdout}`);
    if (result.stderr) outputMessages.push(`STDERR:\n${result.stderr}`);

    if (result.exitCode !== 0) {
      allChecksPassed = false;
      const failureMessage = `Quality Gate FAILED at step: ${check.name}.`;
      outputMessages.push(failureMessage);
      logger.error(failureMessage, {
        stdout: result.stdout,
        stderr: result.stderr,
      });
      break; // Arrêter au premier échec
    }
  }

  if (allChecksPassed) {
    outputMessages.push('\n--- Quality Gate Passed ---');
    logger.info('All quality checks passed successfully.');
  }

  return {
    success: allChecksPassed,
    output: outputMessages.join('\n'),
  };
}
