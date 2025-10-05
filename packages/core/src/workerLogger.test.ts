import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkerLogger, WorkerLogLevel } from './workerLogger';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

describe('WorkerLogger', () => {
  const testLogDir = './test-logs';
  const testJobId = 'test-job-123';
  const testSessionId = 'test-session-456';

  beforeEach(() => {
    // Créer le répertoire de test s'il n'existe pas
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Nettoyer le répertoire de test après chaque test
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  it('devrait créer un WorkerLogger avec la configuration par défaut', () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    expect(logger).toBeDefined();
    expect(existsSync(testLogDir)).toBe(true);
  });

  it('devrait créer un fichier de log avec le bon nom', () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    // Forcer l'écriture d'un message pour créer le fichier
    logger.info('Test message');
    
    // Forcer l'écriture immédiate des logs
    logger['logger'].flush();
    
    // Vérifier qu'un fichier de log a été créé
    const files = require('fs').readdirSync(testLogDir);
    const logFiles = files.filter((file: string) => file.includes(`worker-${testJobId}`));
    expect(logFiles.length).toBeGreaterThan(0);
  });

  it('devrait écrire des logs de différents niveaux', async () => {
    // Créer un logger avec le niveau de log debug
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    // Modifier le niveau de log pour inclure les messages de debug
    logger['logger'].level = 'debug';
    
    logger.debug('Message de debug');
    logger.info('Message d\'info');
    logger.warn('Message d\'avertissement');
    logger.error('Message d\'erreur');
    logger.fatal('Message fatal');
    
    // Forcer l'écriture des logs
    logger.finalize();
    
    // Attendre un peu pour s'assurer que les logs sont écrits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier que le fichier de log contient les messages
    const files = require('fs').readdirSync(testLogDir);
    const logFile = join(testLogDir, files[0]);
    const logContent = readFileSync(logFile, 'utf8');
    
    expect(logContent).toContain('Message de debug');
    expect(logContent).toContain('Message d\'info');
    expect(logContent).toContain('Message d\'avertissement');
    expect(logContent).toContain('Message d\'erreur');
    expect(logContent).toContain('Message fatal');
  });

  it('devrait suivre les métriques correctement', async () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    logger.warn('Avertissement 1');
    logger.warn('Avertissement 2');
    logger.error('Erreur 1');
    logger.error('Erreur 2');
    logger.error('Erreur 3');
    
    logger.finalize();
    
    // Attendre un peu pour s'assurer que les logs sont écrits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier que les métriques sont enregistrées
    const files = require('fs').readdirSync(testLogDir);
    const logFile = join(testLogDir, files[0]);
    const logContent = readFileSync(logFile, 'utf8');
    
    expect(logContent).toContain('"warnings":2');
    expect(logContent).toContain('"errors":3');
  });

  it('devrait enregistrer les exécutions d\'outils', async () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    logger.tool('testTool', 'start', { param1: 'value1' });
    logger.tool('testTool', 'end', undefined, 'result', 100);
    logger.tool('errorTool', 'error', { param2: 'value2' }, undefined, 50);
    
    logger.finalize();
    
    // Attendre un peu pour s'assurer que les logs sont écrits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier que les logs d'outils sont enregistrés
    const files = require('fs').readdirSync(testLogDir);
    const logFile = join(testLogDir, files[0]);
    const logContent = readFileSync(logFile, 'utf8');
    
    expect(logContent).toContain('Tool start: testTool');
    expect(logContent).toContain('Tool end: testTool');
    expect(logContent).toContain('Tool execution failed: errorTool');
    expect(logContent).toContain('"toolName":"testTool"');
    expect(logContent).toContain('"toolName":"errorTool"');
  });

  it('devrait enregistrer les métriques de performance', async () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    logger.performance('test_operation', 150, { detail1: 'value1' });
    
    logger.finalize();
    
    // Attendre un peu pour s'assurer que les logs sont écrits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier que les métriques de performance sont enregistrées
    const files = require('fs').readdirSync(testLogDir);
    const logFile = join(testLogDir, files[0]);
    const logContent = readFileSync(logFile, 'utf8');
    
    expect(logContent).toContain('Performance: test_operation took 150ms');
    expect(logContent).toContain('"operation":"test_operation"');
    expect(logContent).toContain('"duration":150');
  });

  it('devrait enregistrer les métriques personnalisées', async () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    logger.metric('custom_metric', 42, 'units', { extra: 'data' });
    
    logger.finalize();
    
    // Attendre un peu pour s'assurer que les logs sont écrits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier que les métriques personnalisées sont enregistrées
    const files = require('fs').readdirSync(testLogDir);
    const logFile = join(testLogDir, files[0]);
    const logContent = readFileSync(logFile, 'utf8');
    
    expect(logContent).toContain('Metric: custom_metric = 42 units');
    expect(logContent).toContain('"metricName":"custom_metric"');
    expect(logContent).toContain('"value":42');
    expect(logContent).toContain('"unit":"units"');
  });

  it('devrait créer des loggers enfants avec le contexte approprié', async () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    const childLogger = logger.child({ module: 'test-module' });
    
    expect(childLogger).toBeDefined();
    
    childLogger.info('Message du logger enfant');
    logger.finalize();
    
    // Attendre un peu pour s'assurer que les logs sont écrits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier que le contexte est ajouté
    const files = require('fs').readdirSync(testLogDir);
    const logFile = join(testLogDir, files[0]);
    const logContent = readFileSync(logFile, 'utf8');
    
    expect(logContent).toContain('Message du logger enfant');
    expect(logContent).toContain('"module":"test-module"');
  });

  it('devrait gérer les erreurs lors de la rotation des logs', () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    // Simuler une erreur en modifiant une méthode interne
    const originalMethod = logger['checkAndRotateLogs'];
    logger['checkAndRotateLogs'] = () => {
      throw new Error('Test error');
    };
    
    // Ne devrait pas lancer d'exception
    expect(() => logger.info('Test message')).not.toThrow();
    
    // Restaurer la méthode originale
    logger['checkAndRotateLogs'] = originalMethod;
    logger.finalize();
  });

  it('devrait parser correctement les tailles', () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    expect(logger['parseSize']('10B')).toBe(10);
    expect(logger['parseSize']('10KB')).toBe(10 * 1024);
    expect(logger['parseSize']('10MB')).toBe(10 * 1024 * 1024);
    expect(logger['parseSize']('10GB')).toBe(10 * 1024 * 1024 * 1024);
    
    expect(() => logger['parseSize']('invalid')).toThrow('Invalid size format');
    expect(() => logger['parseSize']('10XB')).toThrow('Invalid size format');
  });

  it('devrait parser correctement les intervalles', () => {
    const logger = new WorkerLogger(testJobId, testSessionId, testLogDir);
    
    expect(logger['parseInterval']('10s')).toBe(10 * 1000);
    expect(logger['parseInterval']('10m')).toBe(10 * 60 * 1000);
    expect(logger['parseInterval']('10h')).toBe(10 * 60 * 60 * 1000);
    expect(logger['parseInterval']('10d')).toBe(10 * 24 * 60 * 60 * 1000);
    
    expect(() => logger['parseInterval']('invalid')).toThrow('Invalid interval format');
    expect(() => logger['parseInterval']('10x')).toThrow('Invalid interval format');
  });
});