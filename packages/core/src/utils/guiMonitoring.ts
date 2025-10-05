// GUI Monitoring Logger
// Fichier de log spécifique pour le monitoring de l'interface GUI

import { getLogger } from '../logger.ts';

class GuiMonitoringLogger {
  private log = getLogger().child({ module: 'GuiMonitoring' });

  // Log les erreurs de rendu Canvas
  logCanvasError(error: any, canvasId?: string) {
    this.log.error({
      canvasId,
      error: error.message || error,
      timestamp: new Date().toISOString(),
      type: 'canvas_error'
    }, 'GUI Canvas Error');
  }

  // Log les erreurs côté client
  logClientError(error: any, context?: string) {
    this.log.error({
      context: context || 'unknown',
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      type: 'client_error',
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server'
    }, 'GUI Client Error');
  }

  // Log les problèmes de connectivité
  logConnectivityIssue(issue: string, details?: any) {
    this.log.warn({
      details,
      issue,
      timestamp: new Date().toISOString(),
      type: 'connectivity_issue'
    }, 'GUI Connectivity Issue');
  }

  // Log les ralentissements de performance
  logPerformanceIssue(metric: string, value: number, threshold: number) {
    this.log.warn({
      metric,
      threshold,
      timestamp: new Date().toISOString(),
      type: 'performance_issue',
      value
    }, `GUI Performance Issue: ${metric} = ${value} (threshold: ${threshold})`);
  }

  // Métriques de performance
  logPerformanceMetrics(metrics: {
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    loadComplete?: number;
  }) {
    this.log.info({
      metrics,
      timestamp: new Date().toISOString(),
      type: 'performance_metrics'
    }, 'GUI Performance Metrics');
  }

  // Log les timeouts de requêtes
  logRequestTimeout(url: string, duration: number, context?: string) {
    this.log.warn({
      context: context || 'unknown',
      duration,
      timestamp: new Date().toISOString(),
      type: 'request_timeout',
      url
    }, `GUI Request Timeout: ${url} (${duration}ms)`);
  }

  // Log les interactions utilisateur
  logUserInteraction(action: string, element?: string, details?: any) {
    this.log.debug({
      action,
      details,
      element,
      timestamp: new Date().toISOString(),
      type: 'user_interaction'
    }, 'GUI User Interaction');
  }

  // Log les erreurs de WebSocket
  logWebSocketError(error: any, eventType?: string) {
    this.log.error({
      error: error.message || error,
      eventType,
      timestamp: new Date().toISOString(),
      type: 'websocket_error'
    }, 'GUI WebSocket Error');
  }
}

export const guiMonitoringLogger = new GuiMonitoringLogger();

// Export pour utilisation côté client via injection
if (typeof window !== 'undefined') {
  (window as any).guiMonitoringLogger = guiMonitoringLogger;
}