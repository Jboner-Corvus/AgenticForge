import { useState, useEffect, useMemo } from 'react';
import type { BackendLlmApiKey } from '../../../store/types';

export interface SystemAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeKeys: number;
  degradedKeys: number;
  systemHealth: number;
}

export interface SmartRecommendation {
  type: 'rotate' | 'disable' | 'monitor' | 'optimize';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  keyId?: string;
}

export interface UseLlmAnalyticsReturn {
  systemHealth: SystemAnalytics;
  recommendations: SmartRecommendation[];
  isAnalyzing: boolean;
}

/**
 * Hook pour analyser l'état des clés LLM et générer des recommandations
 */
export const useLlmAnalytics = (backendKeys: BackendLlmApiKey[]): UseLlmAnalyticsReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const systemHealth = useMemo((): SystemAnalytics => {
    if (backendKeys.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        activeKeys: 0,
        degradedKeys: 0,
        systemHealth: 0,
      };
    }

    const totalKeys = backendKeys.length;
    const activeKeys = backendKeys.filter(k => !k.isPermanentlyDisabled).length;
    const degradedKeys = backendKeys.filter(k => k.errorCount > 5).length;

    // Calculate system health score
    let healthScore = 100;
    if (degradedKeys > 0) healthScore -= degradedKeys * 15;
    if (activeKeys === 0 && totalKeys > 0) healthScore = 20;
    if (totalKeys === 0) healthScore = 0;

    const totalRequests = backendKeys.reduce((sum, k) => sum + (k.errorCount || 0), 0);

    return {
      totalRequests,
      successfulRequests: Math.max(0, totalRequests - degradedKeys),
      failedRequests: backendKeys.reduce((sum, k) => sum + (k.errorCount || 0), 0),
      averageResponseTime: 150, // Mock value - would be calculated from real metrics
      activeKeys,
      degradedKeys,
      systemHealth: Math.max(0, healthScore),
    };
  }, [backendKeys]);

  const recommendations = useMemo((): SmartRecommendation[] => {
    const recs: SmartRecommendation[] = [];
    const totalKeys = backendKeys.length;
    const activeKeys = backendKeys.filter(k => !k.isPermanentlyDisabled).length;
    const degradedKeys = backendKeys.filter(k => k.errorCount > 5).length;

    // High priority recommendations
    if (degradedKeys > 0) {
      recs.push({
        type: 'rotate',
        priority: 'high',
        title: 'Rotation de Clés Requise',
        description: `${degradedKeys} clé(s) dégradée(s) détectée(s)`,
        action: 'Faire tourner les clés défaillantes',
      });
    }

    if (activeKeys === 0 && totalKeys > 0) {
      recs.push({
        type: 'disable',
        priority: 'high',
        title: 'Aucune Clé Active',
        description: 'Toutes les clés sont désactivées',
        action: 'Activer au moins une clé',
      });
    }

    // Medium priority recommendations
    if (totalKeys === 0) {
      recs.push({
        type: 'monitor',
        priority: 'medium',
        title: 'Configuration Requise',
        description: 'Aucune clé API configurée',
        action: 'Ajouter votre première clé API',
      });
    }

    // Low priority recommendations
    const oldKeys = backendKeys.filter(k => {
      const daysSinceLastUse = k.lastUsed
        ? (Date.now() - k.lastUsed) / (1000 * 60 * 60 * 24)
        : 30;
      return daysSinceLastUse > 30;
    });

    if (oldKeys.length > 0) {
      recs.push({
        type: 'optimize',
        priority: 'low',
        title: 'Optimisation Disponible',
        description: `${oldKeys.length} clé(s) inutilisée(s) depuis plus de 30 jours`,
        action: 'Considérer la suppression des clés inutiles',
      });
    }

    return recs;
  }, [backendKeys]);

  // Simulate analysis delay for better UX
  useEffect(() => {
    if (backendKeys.length > 0) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => setIsAnalyzing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [backendKeys]);

  return {
    systemHealth,
    recommendations,
    isAnalyzing,
  };
};