import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWorkerLogConfig,
  getWorkerLogLevel,
  DEFAULT_WORKER_LOG_CONFIG,
  PROCESS_MESSAGE_LOG_CONFIG,
  DETACHED_COMMAND_LOG_CONFIG,
  DEV_WORKER_LOG_CONFIG,
  PROD_WORKER_LOG_CONFIG
} from './workerLogConfig';

describe('WorkerLogConfig', () => {
  beforeEach(() => {
    // Sauvegarder les variables d'environnement
    delete process.env.NODE_ENV;
    delete process.env.WORKER_LOG_LEVEL;
  });

  it('devrait retourner la configuration par défaut pour un job inconnu', () => {
    const config = getWorkerLogConfig('unknown-job', 'production');
    expect(config).toEqual(DEFAULT_WORKER_LOG_CONFIG);
  });

  it('devrait retourner la configuration pour les jobs process-message', () => {
    const config = getWorkerLogConfig('process-message', 'production');
    expect(config).toEqual(PROD_WORKER_LOG_CONFIG);
  });

  it('devrait retourner la configuration pour les jobs execute-shell-command-detached', () => {
    const config = getWorkerLogConfig('execute-shell-command-detached', 'production');
    expect(config).toEqual(DETACHED_COMMAND_LOG_CONFIG);
  });

  it('devrait retourner la configuration de développement en environnement de développement', () => {
    const config = getWorkerLogConfig('process-message', 'development');
    expect(config).toEqual(DEV_WORKER_LOG_CONFIG);
  });

  it('devrait retourner la configuration de production en environnement de production', () => {
    const config = getWorkerLogConfig('process-message', 'production');
    expect(config).toEqual(PROD_WORKER_LOG_CONFIG);
  });

  it('devrait utiliser la variable d\'environnement NODE_ENV si elle existe', () => {
    process.env.NODE_ENV = 'production';
    const config = getWorkerLogConfig('process-message');
    expect(config).toEqual(PROD_WORKER_LOG_CONFIG);
  });

  it('devrait retourner le niveau de log par défaut selon l\'environnement', () => {
    expect(getWorkerLogLevel('development')).toBe('debug');
    expect(getWorkerLogLevel('test')).toBe('warn');
    expect(getWorkerLogLevel('staging')).toBe('info');
    expect(getWorkerLogLevel('production')).toBe('info');
  });

  it('devrait utiliser la variable d\'environnement WORKER_LOG_LEVEL si elle existe', () => {
    process.env.WORKER_LOG_LEVEL = 'error';
    expect(getWorkerLogLevel('development')).toBe('error');
    expect(getWorkerLogLevel('production')).toBe('error');
  });

  it('devrait utiliser la variable d\'environnement NODE_ENV pour le niveau de log', () => {
    process.env.NODE_ENV = 'production';
    expect(getWorkerLogLevel()).toBe('info');
    
    process.env.NODE_ENV = 'development';
    expect(getWorkerLogLevel()).toBe('debug');
  });

  it('devrait retourner "info" comme niveau de log par défaut si l\'environnement est inconnu', () => {
    expect(getWorkerLogLevel('unknown')).toBe('info');
  });

  it('devrait avoir des configurations avec des valeurs cohérentes', () => {
    // Vérifier que la configuration de développement utilise des fichiers plus petits
    expect(DEV_WORKER_LOG_CONFIG.maxSize).toBe('20MB');
    expect(DEV_WORKER_LOG_CONFIG.maxFiles).toBe(5);
    expect(DEV_WORKER_LOG_CONFIG.interval).toBe('15m');

    // Vérifier que la configuration de production utilise des fichiers plus grands
    expect(PROD_WORKER_LOG_CONFIG.maxSize).toBe('100MB');
    expect(PROD_WORKER_LOG_CONFIG.maxFiles).toBe(20);
    expect(PROD_WORKER_LOG_CONFIG.interval).toBe('2h');

    // Vérifier que la configuration pour les commandes détachées est plus petite
    expect(DETACHED_COMMAND_LOG_CONFIG.maxSize).toBe('10MB');
    expect(DETACHED_COMMAND_LOG_CONFIG.maxFiles).toBe(5);
    expect(DETACHED_COMMAND_LOG_CONFIG.interval).toBe('30m');
  });
});