import type { SessionData } from '../../types.ts';

import { getRedisClientInstance } from '../../modules/redis/redisClient.ts';

// Types for our persistence system
interface ProjectState {
  lastActivity: number;
  project: any;
  sessionId: string;
  tasks: any[];
  timestamp: number;
}

interface RecoveryPoint {
  description: string;
  id: string;
  state: ProjectState;
  timestamp: number;
}

const PERSISTENCE_KEY_PREFIX = 'agenticforge:project_state:';
const RECOVERY_POINTS_KEY = 'agenticforge:recovery_points:';

/**
 * Clears all saved state for a session
 * @param sessionId The session ID
 */
export async function clearSessionState(sessionId: string): Promise<void> {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    await redis.del(key);

    console.log(`[PERSISTENCE] Session state cleared for session ${sessionId}`);
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error clearing session state for session ${sessionId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Creates a recovery point for the current state
 * @param sessionId The session ID
 * @param project The project data
 * @param tasks The task list
 * @param description Description of this recovery point
 */
export async function createRecoveryPoint(
  sessionId: string,
  project: any,
  tasks: any[],
  description: string,
): Promise<void> {
  try {
    const redis = getRedisClientInstance();
    const recoveryPointId = `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const recoveryPoint: RecoveryPoint = {
      description,
      id: recoveryPointId,
      state: {
        lastActivity: Date.now(),
        project,
        sessionId,
        tasks,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    // Save the recovery point with a 30-day expiration
    const recoveryKey = `${RECOVERY_POINTS_KEY}${sessionId}:${recoveryPointId}`;
    await redis.setex(
      recoveryKey,
      30 * 24 * 60 * 60,
      JSON.stringify(recoveryPoint),
    );

    // Add to the list of recovery points for this session
    const listKey = `${RECOVERY_POINTS_KEY}${sessionId}:list`;
    await redis.lpush(listKey, recoveryPointId);

    // Keep only the last 10 recovery points
    await redis.ltrim(listKey, 0, 9);

    console.log(
      `[PERSISTENCE] Recovery point created for session ${sessionId}: ${description}`,
    );
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error creating recovery point for session ${sessionId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Gets all recovery points for a session
 * @param sessionId The session ID
 * @returns List of recovery points
 */
export async function getRecoveryPoints(
  sessionId: string,
): Promise<RecoveryPoint[]> {
  try {
    const redis = getRedisClientInstance();
    const listKey = `${RECOVERY_POINTS_KEY}${sessionId}:list`;

    const pointIds = await redis.lrange(listKey, 0, -1);
    const recoveryPoints: RecoveryPoint[] = [];

    for (const pointId of pointIds) {
      const recoveryKey = `${RECOVERY_POINTS_KEY}${sessionId}:${pointId}`;
      const pointStr = await redis.get(recoveryKey);

      if (pointStr) {
        const point: RecoveryPoint = JSON.parse(pointStr);
        recoveryPoints.push(point);
      }
    }

    // Sort by timestamp (newest first)
    recoveryPoints.sort((a, b) => b.timestamp - a.timestamp);

    return recoveryPoints;
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error getting recovery points for session ${sessionId}:`,
      error,
    );
    return [];
  }
}

/**
 * Checks if recovery is needed after an interruption
 * @param sessionId The session ID
 * @returns True if recovery is needed, false otherwise
 */
export async function isRecoveryNeeded(sessionId: string): Promise<boolean> {
  try {
    const state = await loadProjectState(sessionId);
    if (!state) return false;

    // Check if there were in-progress tasks
    const hasInProgressTasks = state.tasks.some(
      (task) => task.status === 'in_progress',
    );

    // Check if it's been more than 1 minute since last activity
    const timeSinceLastActivity = Date.now() - state.lastActivity;
    const isLikelyInterruption =
      hasInProgressTasks && timeSinceLastActivity > 60000;

    return isLikelyInterruption;
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error checking recovery status for session ${sessionId}:`,
      error,
    );
    return false;
  }
}

/**
 * Loads the project state from persistent storage
 * @param sessionId The session ID
 * @returns The saved project state or null if not found
 */
export async function loadProjectState(
  sessionId: string,
): Promise<null | ProjectState> {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;

    const stateStr = await redis.get(key);
    if (!stateStr) {
      console.log(
        `[PERSISTENCE] No saved state found for session ${sessionId}`,
      );
      return null;
    }

    const state: ProjectState = JSON.parse(stateStr);

    // Check if the state is recent (less than 7 days old)
    const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000;
    if (!isRecent) {
      console.log(
        `[PERSISTENCE] Saved state for session ${sessionId} is too old, deleting...`,
      );
      await redis.del(key);
      return null;
    }

    console.log(`[PERSISTENCE] Project state loaded for session ${sessionId}`);
    return state;
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error loading project state for session ${sessionId}:`,
      error,
    );
    return null;
  }
}

/**
 * Restores state from a recovery point
 * @param sessionId The session ID
 * @param recoveryPointId The recovery point ID
 * @returns The restored state or null if not found
 */
export async function restoreFromRecoveryPoint(
  sessionId: string,
  recoveryPointId: string,
): Promise<null | ProjectState> {
  try {
    const redis = getRedisClientInstance();
    const recoveryKey = `${RECOVERY_POINTS_KEY}${sessionId}:${recoveryPointId}`;

    const pointStr = await redis.get(recoveryKey);
    if (!pointStr) {
      console.log(
        `[PERSISTENCE] Recovery point ${recoveryPointId} not found for session ${sessionId}`,
      );
      return null;
    }

    const point: RecoveryPoint = JSON.parse(pointStr);
    console.log(
      `[PERSISTENCE] State restored from recovery point for session ${sessionId}: ${point.description}`,
    );

    return point.state;
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error restoring from recovery point for session ${sessionId}:`,
      error,
    );
    return null;
  }
}

/**
 * Saves the current project state to persistent storage
 * @param sessionId The session ID
 * @param project The project data
 * @param tasks The task list
 */
export async function saveProjectState(
  sessionId: string,
  project: any,
  tasks: any[],
): Promise<void> {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;

    const state: ProjectState = {
      lastActivity: Date.now(),
      project,
      sessionId,
      tasks,
      timestamp: Date.now(),
    };

    // Save the state with a 7-day expiration
    await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(state));

    console.log(`[PERSISTENCE] Project state saved for session ${sessionId}`);
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error saving project state for session ${sessionId}:`,
      error,
    );
    throw error;
  }
}
