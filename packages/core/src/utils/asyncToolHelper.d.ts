import type { SessionData } from '@/types.ts';

import { type ErrorDetails } from './errorUtils.ts';
export interface EnqueueParams<TParams> {
  auth: SessionData | undefined;
  cbUrl?: string;
  params: TParams;
  taskId: string;
  toolName: string;
}
export interface TaskOutcome<TParams, TResult> {
  error?: ErrorDetails;
  inParams: TParams;
  msg: string;
  progress?: {
    current: number;
    total: number;
    unit?: string;
  };
  result?: TResult;
  status: 'completed' | 'error' | 'processing';
  taskId: string;
  ts: string;
}
export declare function enqueueTask<TParams extends Record<string, unknown>>(
  args: EnqueueParams<TParams>,
): Promise<string | undefined>;
//# sourceMappingURL=asyncToolHelper.d.ts.map
