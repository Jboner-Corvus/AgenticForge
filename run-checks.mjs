#!/usr/bin/env node
import { execa } from 'execa';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCheck(command, args, packageName) {
  const packagePath = join(__dirname, 'packages', packageName);
  try {
    const { stdout, stderr } = await execa(command, args, { cwd: packagePath });
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    return { success: true, output: stdout };
  } catch (error) {
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    return { success: false, output: error.stdout + '\n' + error.stderr };
  }
}

async function main() {
  const checks = [
    { name: 'TypeCheck UI', command: 'pnpm', args: ['exec', 'tsc', '--noEmit', '-p', 'tsconfig.app.json'], packageName: 'ui' },
    { name: 'TypeCheck Core', command: 'pnpm', args: ['exec', 'tsc', '--noEmit'], packageName: 'core' },
    { name: 'Lint UI', command: 'pnpm', args: ['lint'], packageName: 'ui' },
    { name: 'Lint Core', command: 'pnpm', args: ['lint'], packageName: 'core' },
  ];

  let markdownOutput = '# TODO List: Résoudre les erreurs de vérification\n\n';
  markdownOutput += 'Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint).\n\n';
  markdownOutput += 'La correction de chaque erreur doit se faire **uniquement en modifiant le code source**\n\n';
  markdownOutput += 'Il est interdit d\'exécuter des commandes bash.\n\n';
  markdownOutput += 'Il est interdit de lancer une vérification.\n\n';
  markdownOutput += 'Une fois la correction effectuée, cochez la case `[x]`.\n\n';
  markdownOutput += '--- \n\n';
  markdownOutput += '## Erreurs à corriger\n';

  let errorCount = 0;
  const failedChecks = [];

  for (const check of checks) {
    console.log(`\n🚀 ${check.name}...\n`);
    const result = await runCheck(check.command, check.args, check.packageName);
    if (!result.success) {
      failedChecks.push(check.name);
      const lines = result.output.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && (trimmedLine.includes('error') || trimmedLine.includes('warning'))) {
          // Exclure les messages non pertinents
          if (!trimmedLine.startsWith('>') && !trimmedLine.includes('lint') && !trimmedLine.includes('tsc') && !trimmedLine.includes('ERR_PNPM')) {
            errorCount++;
            markdownOutput += `\n${errorCount}. [ ] **${check.name}:** \`${trimmedLine}\`\n`;
          }
        }
      });
    }
  }

  if (failedChecks.length > 0) {
    markdownOutput += '\n--- \n\n';
    markdownOutput += `✗ ${failedChecks.length} type(s) de vérification ont échoué : ${failedChecks.join(', ')}.\n`;
    markdownOutput += `Veuillez consulter les ${errorCount} erreur(s) détaillée(s) ci-dessus.\n`;
    console.error(`\n✗ ${failedChecks.length} type(s) de vérification ont échoué.`);
  } else {
    markdownOutput += '\n--- \n\n✓ Toutes les vérifications ont réussi.\n';
    console.log('\n✓ Toutes les vérifications ont réussi.');
  }

  await writeFile('all-checks.md', markdownOutput);
  console.log('Les résultats des vérifications ont été enregistrés dans all-checks.md.');
}

main().catch(err => {
  console.error('Une erreur inattendue est survenue :', err);
  process.exit(1);
});