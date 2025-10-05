// GUI Monitoring Client Script
// Injecté dans le frontend pour capturer les erreurs et performances

interface GuiMonitoringLog {
  type: string;
  timestamp: string;
  data: any;
}

class GuiMonitoringClient {
  private logs: GuiMonitoringLog[] = [];
  private maxLogs = 100;
  private isCapturing = true;

  constructor() {
    this.init();
  }

  private init() {
    // Intercepter les erreurs JavaScript
    window.addEventListener('error', (event) => {
      this.log('client_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Intercepter les promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.log('client_error', {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Monitoring des requêtes fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        if (duration > 5000) { // Timeout de 5 secondes
          this.log('request_timeout', { url, duration });
        }

        if (!response.ok) {
          this.log('http_error', {
            url,
            status: response.status,
            statusText: response.statusText,
            duration
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.log('fetch_error', { url, duration, error: (error as Error).message });
        throw error;
      }
    };

    // Monitoring des performances
    this.observePerformance();

    // Envoyer les logs périodiquement au backend
    setInterval(() => {
      this.sendLogsToBackend();
    }, 30000); // Toutes les 30 secondes
  }

  private observePerformance() {
    // Observer Web Vitals si disponibles
    if ('web-vitals' in window) {
      // Import dynamique si disponible
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS((metric: any) => this.log('performance', { metric: 'CLS', value: metric.value }));
        onINP((metric: any) => this.log('performance', { metric: 'INP', value: metric.value }));
        onFCP((metric: any) => this.log('performance', { metric: 'FCP', value: metric.value }));
        onLCP((metric: any) => this.log('performance', { metric: 'LCP', value: metric.value }));
        onTTFB((metric: any) => this.log('performance', { metric: 'TTFB', value: metric.value }));
      }).catch(() => {
        // Fallback si web-vitals n'est pas disponible
      });
    }

    // Observer les mutations DOM pour détecter les ralentissements
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure' && entry.duration > 100) {
            this.log('performance_issue', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }

  log(type: string, data: any) {
    if (!this.isCapturing) return;

    const logEntry: GuiMonitoringLog = {
      type,
      timestamp: new Date().toISOString(),
      data
    };

    this.logs.push(logEntry);

    // Garder seulement les derniers logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Envoyer immédiatement pour les erreurs critiques
    if (type === 'client_error' || type === 'fetch_error') {
      this.sendLogsToBackend();
    }
  }

  private async sendLogsToBackend() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = []; // Vider le buffer

    try {
      await fetch('/api/gui-monitoring/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_AUTH_TOKEN}`
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      console.error('Failed to send GUI monitoring logs:', error);
      // Remettre les logs dans le buffer en cas d'échec
      this.logs = [...logsToSend, ...this.logs].slice(0, this.maxLogs);
    }
  }

  // Méthodes publiques pour le monitoring manuel
  logUserInteraction(action: string, element?: string, details?: any) {
    this.log('user_interaction', { action, element, details });
  }

  logCanvasError(error: Error, canvasId?: string) {
    this.log('canvas_error', {
      message: error.message,
      stack: error.stack,
      canvasId
    });
  }

  logConnectivityIssue(issue: string, details?: any) {
    this.log('connectivity_issue', { issue, details });
  }

  startCapture() {
    this.isCapturing = true;
  }

  stopCapture() {
    this.isCapturing = false;
  }

  getLogs(): GuiMonitoringLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Initialiser le monitoring
const guiMonitoringClient = new GuiMonitoringClient();

// Export pour utilisation globale
declare global {
  interface Window {
    guiMonitoringClient: GuiMonitoringClient;
  }
}

window.guiMonitoringClient = guiMonitoringClient;

export default guiMonitoringClient;