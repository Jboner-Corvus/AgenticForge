#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple log viewer test
class SimpleLogViewer {
  constructor(logDir = './logs') {
    this.logDir = logDir;
  }

  getLogFiles() {
    if (!fs.existsSync(this.logDir)) {
      return [];
    }

    return fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.log'))
      .map(filename => {
        const filePath = path.join(this.logDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
  }

  getLogsForJob(jobId) {
    const logFiles = this.getLogFiles().filter(file => file.filename.includes(`worker-${jobId}`));
    const logs = [];

    for (const file of logFiles) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line);
            logs.push(logEntry);
          } catch (parseError) {
            // Ignorer les lignes qui ne sont pas du JSON valide
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${file.filename}:`, error);
      }
    }

    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  displayLogs(logs) {
    console.log(`\n=== Affichage de ${logs.length} logs ===`);

    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const level = log.level.toUpperCase().padEnd(5);
      const type = log.type ? `[${log.type}]` : '';

      console.log(`\n[${index + 1}] [${timestamp}] ${level} ${type}`);
      console.log(`Message: ${log.message}`);

      if (log.jobId) console.log(`Job ID: ${log.jobId}`);
      if (log.sessionId) console.log(`Session ID: ${log.sessionId}`);
      if (log.service) console.log(`Service: ${log.service}`);

      // Afficher les détails importants
      if (log.toolName) {
        console.log(`  Tool: ${log.toolName}, Action: ${log.action}, Duration: ${log.duration}ms`);
      }

      if (log.operation) {
        console.log(`  Operation: ${log.operation}, Duration: ${log.duration}ms`);
      }

      if (log.metrics) {
        console.log(`  Metrics: uptime=${log.metrics.uptime}ms, errors=${log.metrics.errors}, warnings=${log.metrics.warnings}`);
      }

      if (log.result) {
        console.log(`  Result: ${JSON.stringify(log.result, null, 2)}`);
      }

      if (log.error) {
        console.log(`  Error: ${log.error.message}`);
      }
    });
  }
}

// Test du log viewer
console.log('🔍 Test du Log Viewer Simple');

const viewer = new SimpleLogViewer();
const logFiles = viewer.getLogFiles();

console.log(`📁 Fichiers de logs trouvés: ${logFiles.length}`);
logFiles.forEach(file => {
  console.log(`  - ${file.filename} (${file.size} bytes, ${file.modified.toLocaleString()})`);
});

if (logFiles.length > 0) {
  // Tester avec le premier fichier de log
  const firstFile = logFiles[0];
  const match = firstFile.filename.match(/worker-(.+?)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.log/);

  if (match) {
    const jobId = match[1];
    console.log(`\n🎯 Test d'affichage des logs pour le job ${jobId}`);

    const logs = viewer.getLogsForJob(jobId);
    console.log(`📊 Logs trouvés pour le job ${jobId}: ${logs.length}`);

    if (logs.length > 0) {
      viewer.displayLogs(logs.slice(0, 5)); // Afficher les 5 premiers logs

      console.log('\n🔍 Analyse du problème:');
      console.log('========================');

      logs.forEach((log, index) => {
        if (index < 3) { // Analyser les 3 premiers logs
          console.log(`\nLog ${index + 1}:`);
          console.log(`  - Message défini: ${log.message ? '✅' : '❌'}`);
          console.log(`  - Type défini: ${log.type ? '✅' : '❌'}`);
          console.log(`  - Niveau défini: ${log.level ? '✅' : '❌'}`);
          console.log(`  - Timestamp défini: ${log.timestamp ? '✅' : '❌'}`);
          console.log(`  - Job ID défini: ${log.jobId ? '✅' : '❌'}`);
          console.log(`  - Contenu du message: "${log.message}"`);

          if (log.message === undefined || log.message === null) {
            console.log(`  ⚠️  PROBLÈME: Le message est ${log.message}`);
          }
        }
      });
    } else {
      console.log('❌ Aucun log trouvé pour ce job');
    }
  } else {
    console.log('❌ Impossible d\'extraire le job ID du nom de fichier');
  }
} else {
  console.log('❌ Aucun fichier de log trouvé');
}