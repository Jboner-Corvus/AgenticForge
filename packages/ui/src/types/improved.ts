// Improved type definitions to fix TypeScript errors
import type { ComponentType, ReactNode } from 'react';

// Enhanced component prop types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

// Store types with better type safety
export interface StoreSlice<T> {
  (...args: unknown[]): T;
}

export interface StoreActions<T = unknown> {
  [key: string]: (...args: unknown[]) => T | Promise<T> | void;
}

// API types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Form types
export interface FormField<T = unknown> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
  disabled?: boolean;
}

export interface FormState<T extends Record<string, unknown> = Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = unknown, E = Error> {
  data: T | null;
  error: E | null;
  state: LoadingState;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

// Component render props
export interface RenderProp<T = unknown> {
  (props: T): ReactNode;
}

// Higher-order component types
export type HOC<P = unknown, R = P> = (
  Component: ComponentType<P>
) => ComponentType<R>;

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Animation types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string | number[];
  repeat?: number;
  repeatType?: 'loop' | 'reverse' | 'mirror';
}

export interface MotionVariant {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: AnimationConfig;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  destructive: string;
  success: string;
  warning: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
}

// Canvas types
export type CanvasContentType = 'html' | 'markdown' | 'url' | 'text';

export interface CanvasItem {
  id: string;
  title: string;
  content: string;
  type: CanvasContentType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Session types
export interface BaseSession {
  id: string;
  name: string;
  timestamp: number;
  status?: 'active' | 'inactive' | 'error';
}

// Message types (enhanced)
export interface BaseMessage {
  id: string;
  content: string;
  timestamp: number;
  type: 'user' | 'assistant' | 'system' | 'error';
  metadata?: Record<string, unknown>;
}

// Store subscription types
export interface StoreSubscription {
  unsubscribe: () => void;
}

export type StoreListener<T> = (state: T, previousState: T) => void;

// Error types
export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Cache types
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  serialize?: boolean;
  compress?: boolean;
}

export interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number;
  tags?: string[];
}

// Performance monitoring
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Feature flags
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rollout?: number; // 0-100 percentage
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, FeatureFlag>;
  cache: CacheOptions;
}

// Plugin/Extension types
export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  hooks?: Record<string, (...args: unknown[]) => void>;
}

// Navigation types
export type NavigationPage = 'chat' | 'leaderboard' | 'llm-api-keys' | 'oauth' | 'settings';

export interface NavigationItem {
  key: NavigationPage;
  label: string;
  icon?: ComponentType;
  disabled?: boolean;
  badge?: string | number;
}

// Layout types
export type LayoutMode = 'freeform' | 'grid' | 'cascade' | 'battlefield';

export interface LayoutConfig {
  mode: LayoutMode;
  gridSize?: number;
  snapToGrid?: boolean;
  showGrid?: boolean;
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

// Search types
export interface SearchOptions {
  query: string;
  filters?: Record<string, unknown>;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  hasMore: boolean;
}

// Export all types for easy importing
export type * from './chat.d';
export type * from '../store/types';