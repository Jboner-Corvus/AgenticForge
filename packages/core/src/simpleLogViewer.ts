#!/usr/bin/env node

import { LogViewer, viewLogsForJob, viewJobSummary, listAvailableJobs } from './logViewer';

// Fonction pour afficher l'aide
function showHelp(): void {
  console.log(`
Utilitaire de visualisation des logs des workers

Usage:
  tsx simpleLogViewer.ts [commande] [options]

Commandes:
  list, ls                    Liste tous les jobs avec des logs disponibles
  job <jobId>                 Affiche les logs d'un job spécifique
  summary <jobId>             Affiche un résumé d'un job spécifique
  all                         Affiche tous les logs avec filtres optionnels
  search <query>              Recherche un texte dans les logs
  metrics <jobId>             Affiche les métriques d'un job spécifique

Options pour la commande 'job':
  --limit <nombre>            Limite le nombre de logs affichés (défaut: 50)
  --error                     Affiche uniquement les erreurs
  --warn                      Affiche uniquement les avertissements
  --type <type>               Filtre par type de log (tool, perf, metric, etc.)
  --json                      Affiche le résultat au format JSON

Options pour la commande 'all':
  --job <jobId>               Filtre par ID de job
  --session <sessionId>       Filtre par ID de session
  --limit <nombre>            Limite le nombre de logs affichés (défaut: 100)
  --error                     Affiche uniquement les erreurs
  --warn                      Affiche uniquement les avertissements
  --type <type>               Filtre par type de log
  --json                      Affiche le résultat au format JSON

Options pour la commande 'search':
  --job <jobId>               Limite la recherche à un job spécifique
  --limit <nombre>            Limite le nombre de résultats (défaut: 20)

Exemples:
  tsx simpleLogViewer.ts list
  tsx simpleLogViewer.ts job abc123
  tsx simpleLogViewer.ts job abc123 --error --limit 10
  tsx simpleLogViewer.ts summary abc123
  tsx simpleLogViewer.ts search "erreur" --job abc123
  tsx simpleLogViewer.ts metrics abc123
`);
}

// Fonction pour parser les arguments
function parseArgs(args: string[]): { command: string; options: Record<string, any> } {
  const result: { command: string; options: Record<string, any> } = {
    command: '',
    options: {}
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Option
      const key = arg.substring(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        result.options[key] = nextArg;
        i += 2;
      } else {
        result.options[key] = 'true';
        i += 1;
      }
    } else if (arg.startsWith('-')) {
      // Option courte
      const key = arg.substring(1);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        result.options[key] = nextArg;
        i += 2;
      } else {
        result.options[key] = 'true';
        i += 1;
      }
    } else if (!result.command) {
      // Première commande
      result.command = arg;
      i += 1;
    } else {
      // Argument supplémentaire pour la commande
      if (!result.options['_']) {
        result.options['_'] = [];
      }
      (result.options['_'] as string[]).push(arg);
      i += 1;
    }
  }

  return result;
}

// Fonction principale
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const { command, options } = parseArgs(args);
  const viewer = new LogViewer();

  try {
    switch (command) {
      case 'list':
      case 'ls': {
        const jobs = listAvailableJobs();
        if (jobs.length === 0) {
          console.log('Aucun job trouvé.');
        } else {
          console.log('Jobs disponibles:');
          jobs.forEach(jobId => console.log(`  - ${jobId}`));
        }
        break;
      }

      case 'job': {
        const jobId = options['_']?.[0];
        if (!jobId) {
          console.error('Erreur: ID de job requis.');
          console.log('Usage: tsx simpleLogViewer.ts job <jobId> [options]');
          return;
        }

        const filter: any = {};
        if (options.error) filter.level = 'error';
        if (options.warn) filter.level = 'warn';
        if (options.type) filter.type = options.type;
        if (options.limit) filter.limit = parseInt(options.limit);

        const logs = viewer.getLogsForJob(jobId, filter);
        
        if (options.json) {
          console.log(JSON.stringify(logs, null, 2));
        } else {
          viewer.displayLogs(logs);
        }
        break;
      }

      case 'summary': {
        const jobId = options['_']?.[0];
        if (!jobId) {
          console.error('Erreur: ID de job requis.');
          console.log('Usage: tsx simpleLogViewer.ts summary <jobId>');
          return;
        }

        viewJobSummary(jobId);
        break;
      }

      case 'all': {
        const filter: any = {};
        if (options.job) filter.jobId = options.job;
        if (options.session) filter.sessionId = options.session;
        if (options.error) filter.level = 'error';
        if (options.warn) filter.level = 'warn';
        if (options.type) filter.type = options.type;
        if (options.limit) filter.limit = parseInt(options.limit);

        const logs = viewer.getAllLogs(filter);
        
        if (options.json) {
          console.log(JSON.stringify(logs, null, 2));
        } else {
          viewer.displayLogs(logs);
        }
        break;
      }

      case 'search': {
        const query = options['_']?.[0];
        if (!query) {
          console.error('Erreur: Requête de recherche requise.');
          console.log('Usage: tsx simpleLogViewer.ts search <query> [options]');
          return;
        }

        const filter: any = {};
        if (options.job) filter.jobId = options.job;
        if (options.limit) filter.limit = parseInt(options.limit);

        const logs = options.job 
          ? viewer.getLogsForJob(options.job, filter)
          : viewer.getAllLogs(filter);

        const filteredLogs = logs.filter(log => 
          JSON.stringify(log).toLowerCase().includes(query.toLowerCase())
        );

        if (filteredLogs.length === 0) {
          console.log(`Aucun résultat trouvé pour "${query}"`);
        } else {
          console.log(`Résultats pour "${query}" (${filteredLogs.length} trouvé(s)):`);
          viewer.displayLogs(filteredLogs);
        }
        break;
      }

      case 'metrics': {
        const jobId = options['_']?.[0];
        if (!jobId) {
          console.error('Erreur: ID de job requis.');
          console.log('Usage: tsx simpleLogViewer.ts metrics <jobId>');
          return;
        }

        const metrics = viewer.getMetricsForJob(jobId);
        if (!metrics) {
          console.log(`Aucune métrique trouvée pour le job ${jobId}`);
        } else {
          console.log(JSON.stringify(metrics, null, 2));
        }
        break;
      }

      default:
        console.error(`Commande inconnue: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();