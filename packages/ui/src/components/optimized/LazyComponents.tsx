// Lazy loaded components for better performance
import { lazy, Suspense, memo } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';

// Lazy load heavy components
export const LeaderboardPage = lazy(() => 
  import('../LeaderboardPage').then(module => ({ default: module.LeaderboardPage }))
);

export const EnhancedLlmKeyManager = lazy(() => 
  import('../EnhancedLlmKeyManager').then(module => ({ default: module.EnhancedLlmKeyManager }))
);

export const LlmApiKeyManagementPage = lazy(() => 
  import('../LlmApiKeyManagementPage').then(module => ({ default: module.LlmApiKeyManagementPage }))
);

export const OAuthManagementPage = lazy(() => 
  import('../OAuthManagementPage').then(module => ({ default: module.OAuthManagementPage }))
);

// Les composants TodoList ont été remplacés par UnifiedTodoListPanel

export const EpicCanvas = lazy(() => 
  import('../EpicCanvas').then(module => ({ default: module.EpicCanvas }))
);

export const AgentOutputCanvas = lazy(() => 
  import('../AgentOutputCanvas')
);

export const EpicLayoutManager = lazy(() => 
  import('../EpicLayoutManager').then(module => ({ default: module.EpicLayoutManager }))
);

export const DebugLogContainer = lazy(() => 
  import('../DebugLogContainer').then(module => ({ default: module.DebugLogContainer }))
);

export const SubAgentCLIView = lazy(() => 
  import('../SubAgentCLIView')
);

// Loading wrapper component
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner className="h-8 w-8 mx-auto my-4" /> 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Pre-configured lazy components with loading states
export const LazyLeaderboardPage: React.FC = () => (
  <LazyWrapper fallback={
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner className="h-8 w-8" />
      <span className="ml-2 text-gray-400">Loading leaderboard...</span>
    </div>
  }>
    <LeaderboardPage />
  </LazyWrapper>
);

export const LazyLlmKeyManager: React.FC = memo(() => (
  <LazyWrapper fallback={
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner className="h-8 w-8" />
      <span className="ml-2 text-gray-400">Loading LLM key manager...</span>
    </div>
  }>
    <EnhancedLlmKeyManager />
  </LazyWrapper>
));

LazyLlmKeyManager.displayName = 'LazyLlmKeyManager';

export const LazyOAuthPage: React.FC = memo(() => (
  <LazyWrapper fallback={
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner className="h-8 w-8" />
      <span className="ml-2 text-gray-400">Loading OAuth settings...</span>
    </div>
  }>
    <OAuthManagementPage />
  </LazyWrapper>
));

LazyOAuthPage.displayName = 'LazyOAuthPage';

// Les composants TodoListPanel ont été remplacés par UnifiedTodoListPanel

export const LazyCanvas: React.FC = () => (
  <LazyWrapper fallback={
    <div className="flex items-center justify-center h-full bg-gray-900/50 rounded-lg">
      <LoadingSpinner className="h-6 w-6" />
      <span className="ml-2 text-gray-400 text-sm">Loading canvas...</span>
    </div>
  }>
    <EpicCanvas />
  </LazyWrapper>
);

export const LazyAgentCanvas: React.FC = () => (
  <LazyWrapper>
    <AgentOutputCanvas />
  </LazyWrapper>
);

export const LazyLayoutManager: React.FC = () => (
  <LazyWrapper>
    <EpicLayoutManager />
  </LazyWrapper>
);

export const LazyDebugLogContainer: React.FC = () => (
  <LazyWrapper>
    <DebugLogContainer />
  </LazyWrapper>
);

export const LazySubAgentCLIView: React.FC<{ jobId: string }> = ({ jobId }) => (
  <LazyWrapper>
    <SubAgentCLIView jobId={jobId} />
  </LazyWrapper>
);