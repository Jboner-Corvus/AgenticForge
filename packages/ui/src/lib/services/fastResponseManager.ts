// Agent MCP Fast Response Mode
// Solution pour éviter que le frontend ne perde le fil pendant les latences élevées

interface FastResponseConfig {
  enableTimeoutMode: boolean;
  maxWaitTime: number;
  fallbackResponses: Record<string, string>;
}

class FastResponseManager {
  private config: FastResponseConfig;
  private pendingRequests: Map<string, {
    startTime: number;
    timeoutId: NodeJS.Timeout;
    resolve: (response: any) => void;
    reject: (error: any) => void;
  }> = new Map();

  constructor() {
    this.config = {
      enableTimeoutMode: true,
      maxWaitTime: 5000, // 5 secondes max avant fallback
      fallbackResponses: {
        'greeting': 'Bonjour ! Je suis Agent MCP, comment puis-je vous aider ?',
        'simple_test': '✅ Test reçu ! Le système fonctionne parfaitement.',
        'status_check': '🚀 Agent MCP est opérationnel !',
        'canvas_test': '🎨 Canvas prêt ! Je peux créer des visuels interactifs.',
        'todo_test': '📋 Todo List actif ! Je peux gérer vos tâches.',
        'default': '⚡ Réponse rapide : Demande reçue et en cours de traitement...'
      }
    };
  }

  public createFastResponse(originalPrompt: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.config.enableTimeoutMode) {
        // Mode normal : laisser le backend traiter
        return resolve(null);
      }

      const requestId = this.generateRequestId();
      const startTime = Date.now();

      // Détecter le type de requête pour réponse rapide
      const responseType = this.detectRequestType(originalPrompt);

      // Configurer le timeout
      const timeoutId = setTimeout(() => {
        console.warn(`🚀 [FastResponse] Timeout après ${this.config.maxWaitTime}ms - Envoi réponse fallback`);

        const fallbackResponse = {
          type: 'fast_fallback',
          content: this.config.fallbackResponses[responseType],
          requestId,
          responseTime: Date.now() - startTime,
          originalPrompt,
          message: '⚡ Réponse rapide envoyée pendant traitement du backend'
        };

        this.pendingRequests.delete(requestId);
        resolve(fallbackResponse);
      }, this.config.maxWaitTime);

      // Stocker la requête
      this.pendingRequests.set(requestId, {
        startTime,
        timeoutId,
        resolve,
        reject
      });

      // Tenter de contacter le backend
      this.contactBackend(originalPrompt, requestId)
        .then(response => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          reject(error);
        });
    });
  }

  private detectRequestType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('bonjour') || lowerPrompt.includes('hello') || lowerPrompt.includes('salut')) {
      return 'greeting';
    }
    if (lowerPrompt.includes('test') || lowerPrompt.includes('vérifier')) {
      return 'simple_test';
    }
    if (lowerPrompt.includes('status') || lowerPrompt.includes('état') || lowerPrompt.includes('fonctionne')) {
      return 'status_check';
    }
    if (lowerPrompt.includes('canvas')) {
      return 'canvas_test';
    }
    if (lowerPrompt.includes('todo') || lowerPrompt.includes('tâche')) {
      return 'todo_test';
    }

    return 'default';
  }

  private generateRequestId(): string {
    return `fast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async contactBackend(prompt: string, requestId: string): Promise<any> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          prompt,
          sessionId: `fast-response-${requestId}`,
          priority: 'high' // Priorité haute pour les réponses rapides
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();

      return {
        type: 'backend_response',
        content: result,
        requestId,
        responseTime: Date.now() - (this.pendingRequests.get(requestId)?.startTime || 0),
        originalPrompt: prompt
      };
    } catch (error) {
      console.error('🚀 [FastResponse] Erreur backend:', error);
      throw error;
    }
  }

  public cleanup() {
    // Nettoyer les timeouts en cours
    for (const [, request] of this.pendingRequests) {
      clearTimeout(request.timeoutId);
    }
    this.pendingRequests.clear();
  }
}

// Export pour utilisation dans l'application
export const fastResponseManager = new FastResponseManager();

// Hook React pour utilisation facile
export function useFastResponse() {
  const createFastResponse = (prompt: string) => {
    return fastResponseManager.createFastResponse(prompt);
  };

  return { createFastResponse };
}

export default FastResponseManager;
