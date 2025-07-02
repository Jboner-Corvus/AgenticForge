import { config } from '../config.js';
import logger from '../logger.js';
// src/utils/qualityGate.ts
import { runInSandbox } from './dockerManager.js';

const DEV_SANDBOX_IMAGE = 'node:24-alpine'; // CORRECTION: Passage de node:20 à node:24
const mountPoint = {
  Source: config.HOST_PROJECT_PATH || process.cwd(),
  Target: '/usr/src/app',
  Type: 'bind' as const,
};

interface QualityResult {
  output: string;
  success: boolean;
}

/**
 * Exécute une série de vérifications de qualité (types, format, lint) dans un sandbox Docker.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
export async function runQualityGate(): Promise<QualityResult> {
  const outputMessages: string[] = [];

  // CORRECTION: Ajout de 'set -e' pour que le script s'arrête à la première erreur
  const qualityCommand = [
    'sh',
    '-c',
    `
      set -e 
      echo "--- Installing pnpm..."
      npm install -g pnpm
      
      echo "\n--- Running: Lint (Fix)..."
      pnpm run lint:fix
      
      echo "\n--- Running: Format..."
      pnpm run format
      
      echo "\n--- Running: Type Check..."
      pnpm exec tsc --noEmit
    `,
  ];

  logger.info('Running all quality checks in a single sandbox...');
  outputMessages.push(`--- Running Quality Gate ---`);

  const result = await runInSandbox(DEV_SANDBOX_IMAGE, qualityCommand, {
    mounts: [mountPoint],
    workingDir: '/usr/src/app',
  });

  outputMessages.push(`--- Sandbox Execution Finished ---`);
  outputMessages.push(`Exit Code: ${result.exitCode}`);
  if (result.stdout) outputMessages.push(`STDOUT:\n${result.stdout}`);
  if (result.stderr) outputMessages.push(`STDERR:\n${result.stderr}`);

  // La vérification du succès est maintenant fiable grâce au 'set -e'
  const allChecksPassed = result.exitCode === 0;

  if (allChecksPassed) {
    outputMessages.push('\n--- Quality Gate Passed ---');
    logger.info('All quality checks passed successfully.');
  } else {
    const failureMessage = `Quality Gate FAILED with exit code ${result.exitCode}.`;
    outputMessages.push(failureMessage);
    logger.error(failureMessage, {
      stderr: result.stderr,
      stdout: result.stdout,
    });
  }

  return {
    output: outputMessages.join('\n'),
    success: allChecksPassed,
  };
}
