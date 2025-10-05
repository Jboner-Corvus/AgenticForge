#!/usr/bin/env node

import { program } from 'commander';
import { LogViewer, viewLogsForJob, viewJobSummary, listAvailableJobs } from './logViewer';

// Configuration du programme CLI
program
  .name('view-logs')
  .description('Utilitaire pour visualiser les logs des workers')
  .version('1.0.0');

// Commande pour lister les jobs disponibles
program
  .command('list')
  .alias('ls')
  .description('Lister tous les jobs avec des logs disponibles')
  .action(() => {
    const jobs = listAvailableJobs();
    
    if (jobs.length === 0) {
      console.log('Aucun job trouvé.');
      return;
    }
    
    console.log('Jobs disponibles:');
    jobs.forEach(jobId => {
      console.log(`  - ${jobId}`);
    });
  });

// Commande pour voir les logs d'un job spécifique
program
  .command('job <jobId>')
  .description('Voir les logs d\'un job spécifique')
  .option('-l, --limit <number>', 'Limiter le nombre de logs affichés', '50')
  .option('-e, --error', 'Afficher uniquement les erreurs')
  .option('-w, --warn', 'Afficher uniquement les avertissements')
  .option('-t, --type <type>', 'Filtrer par type de log (tool, perf, metric, etc.)')
  .option('-s, --since <date>', 'Afficher les logs depuis cette date (ISO 8601)')
  .option('-u, --until <date>', 'Afficher les logs jusqu\'à cette date (ISO 8601)')
  .option('--no-display', 'Ne pas afficher les logs (retourne JSON)')
  .option('--summary', 'Afficher uniquement un résumé du job')
  .action((jobId, options) => {
    if (options.summary) {
      viewJobSummary(jobId);
      return;
    }
    
    const filter: any = {};
    
    if (options.error) filter.level = 'error';
    if (options.warn) filter.level = 'warn';
    if (options.type) filter.type = options.type;
    if (options.since) filter.since = options.since;
    if (options.until) filter.until = options.until;
    if (options.limit) filter.limit = parseInt(options.limit);
    
    const logs = viewLogsForJob(jobId, { 
      filter, 
      display: options.display !== false 
    });
    
    if (!options.display) {
      console.log(JSON.stringify(logs, null, 2));
    }
  });

// Commande pour voir tous les logs avec filtres
program
  .command('all')
  .description('Voir tous les logs avec filtres optionnels')
  .option('-j, --job <jobId>', 'Filtrer par ID de job')
  .option('-s, --session <sessionId>', 'Filtrer par ID de session')
  .option('-e, --error', 'Afficher uniquement les erreurs')
  .option('-w, --warn', 'Afficher uniquement les avertissements')
  .option('-t, --type <type>', 'Filtrer par type de log (tool, perf, metric, etc.)')
  .option('-l, --limit <number>', 'Limiter le nombre de logs affichés', '100')
  .option('--no-display', 'Ne pas afficher les logs (retourne JSON)')
  .action((options) => {
    const viewer = new LogViewer();
    const filter: any = {};
    
    if (options.job) filter.jobId = options.job;
    if (options.session) filter.sessionId = options.session;
    if (options.error) filter.level = 'error';
    if (options.warn) filter.level = 'warn';
    if (options.type) filter.type = options.type;
    if (options.limit) filter.limit = parseInt(options.limit);
    
    const logs = viewer.getAllLogs(filter);
    
    if (options.display !== false) {
      viewer.displayLogs(logs);
    } else {
      console.log(JSON.stringify(logs, null, 2));
    }
  });

// Commande pour voir les métriques d'un job
program
  .command('metrics <jobId>')
  .description('Voir les métriques détaillées d\'un job')
  .action((jobId) => {
    const viewer = new LogViewer();
    const metrics = viewer.getMetricsForJob(jobId);
    
    if (!metrics) {
      console.log(`Aucun métrique trouvé pour le job ${jobId}`);
      return;
    }
    
    console.log(JSON.stringify(metrics, null, 2));
  });

// Commande pour rechercher dans les logs
program
  .command('search <query>')
  .description('Rechercher un texte dans tous les logs')
  .option('-j, --job <jobId>', 'Limiter la recherche à un job spécifique')
  .option('-l, --limit <number>', 'Limiter le nombre de résultats', '20')
  .action((query, options) => {
    const viewer = new LogViewer();
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
      return;
    }
    
    console.log(`Résultats pour "${query}" (${filteredLogs.length} trouvé(s)):`);
    viewer.displayLogs(filteredLogs);
  });

// Commande pour surveiller les logs en temps réel
program
  .command('watch <jobId>')
  .description('Surveiller les logs d\'un job en temps réel')
  .option('-i, --interval <seconds>', 'Intervalle de vérification en secondes', '2')
  .action((jobId, options) => {
    const viewer = new LogViewer();
    const interval = parseInt(options.interval) * 1000;
    let lastTimestamp = new Date().toISOString();
    
    console.log(`Surveillance des logs pour le job ${jobId} (Ctrl+C pour arrêter)...\n`);
    
    const watchInterval = setInterval(() => {
      const filter = {
        jobId,
        since: lastTimestamp
      };
      
      const logs = viewer.getLogsForJob(jobId, filter);
      
      if (logs.length > 0) {
        viewer.displayLogs(logs);
        lastTimestamp = logs[logs.length - 1].timestamp;
      }
    }, interval);
    
    process.on('SIGINT', () => {
      clearInterval(watchInterval);
      console.log('\nSurveillance arrêtée.');
      process.exit(0);
    });
  });

// Gérer les erreurs
program.on('command:*', () => {
  console.error('Commande invalide');
  process.exit(1);
});

// Parser les arguments
program.parse();