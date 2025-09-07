import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  CheckCircle,
} from 'lucide-react';
import type {
  SystemAnalytics,
  SmartRecommendation,
} from '../hooks/useLlmAnalytics';

interface AnalyticsDashboardProps {
  systemHealth: SystemAnalytics;
  recommendations: SmartRecommendation[];
  isAnalyzing: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  systemHealth,
  recommendations,
  isAnalyzing,
}) => {
  const criticalRecommendations = recommendations.filter(
    (r) => r.priority === 'high',
  );
  const hasCriticalIssues = criticalRecommendations.length > 0;

  return (
    <motion.div
      className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* System Health Card */}
      <Card
        className={`col-span-1 lg:col-span-2 ${
          systemHealth.systemHealth > 80
            ? 'border-green-500/50 bg-green-900/10'
            : systemHealth.systemHealth > 60
              ? 'border-yellow-500/50 bg-yellow-900/10'
              : 'border-red-500/50 bg-red-900/10'
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Brain
              className={`h-5 w-5 mr-2 ${
                systemHealth.systemHealth > 80
                  ? 'text-green-400'
                  : systemHealth.systemHealth > 60
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Intelligence Artificielle du Système
            </span>
            {isAnalyzing && (
              <div className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Santé Globale</span>
              <Badge
                className={`${
                  systemHealth.systemHealth > 80
                    ? 'bg-green-900/50 text-green-300'
                    : systemHealth.systemHealth > 60
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'bg-red-900/50 text-red-300'
                }`}
              >
                {systemHealth.systemHealth}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealth.totalRequests.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Requêtes Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {systemHealth.successfulRequests.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Réussites</div>
              </div>
            </div>

            {hasCriticalIssues && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-300 font-medium">
                    {criticalRecommendations.length} action(s) requise(s)
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="border-blue-500/50 bg-blue-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300">Métriques de Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Temps de Réponse Moyen
              </span>
              <span className="text-lg font-bold text-blue-400">
                {systemHealth.averageResponseTime}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Clés Actives</span>
              <span className="text-lg font-bold text-green-400">
                {systemHealth.activeKeys}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Clés Dégradées</span>
              <span
                className={`text-lg font-bold ${
                  systemHealth.degradedKeys > 0
                    ? 'text-red-400'
                    : 'text-green-400'
                }`}
              >
                {systemHealth.degradedKeys}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card className="border-purple-500/50 bg-purple-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-purple-400" />
            <span className="text-purple-300">Recommandations IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 rounded text-xs ${
                  rec.priority === 'high'
                    ? 'bg-red-900/20 border border-red-500/30'
                    : rec.priority === 'medium'
                      ? 'bg-yellow-900/20 border border-yellow-500/30'
                      : 'bg-green-900/20 border border-green-500/30'
                }`}
              >
                <div className="font-medium text-white">{rec.title}</div>
                <div className="text-gray-400 truncate">{rec.description}</div>
              </motion.div>
            ))}
            {recommendations.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-green-400">Système optimal</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnalyticsDashboard;
