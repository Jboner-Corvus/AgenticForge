import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/persistence/projectPersistence.ts
init_esm_shims();
var PERSISTENCE_KEY_PREFIX = "agenticforge:project_state:";
async function clearSessionState(sessionId) {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    await redis.del(key);
    console.log(`[PERSISTENCE] Session state cleared for session ${sessionId}`);
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error clearing session state for session ${sessionId}:`,
      error
    );
    throw error;
  }
}
async function isRecoveryNeeded(sessionId) {
  try {
    const state = await loadProjectState(sessionId);
    if (!state) return false;
    const hasInProgressTasks = state.tasks.some(
      (task) => task.status === "in_progress"
    );
    const timeSinceLastActivity = Date.now() - state.lastActivity;
    const isLikelyInterruption = hasInProgressTasks && timeSinceLastActivity > 6e4;
    return isLikelyInterruption;
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error checking recovery status for session ${sessionId}:`,
      error
    );
    return false;
  }
}
async function loadProjectState(sessionId) {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    const stateStr = await redis.get(key);
    if (!stateStr) {
      console.log(
        `[PERSISTENCE] No saved state found for session ${sessionId}`
      );
      return null;
    }
    const state = JSON.parse(stateStr);
    const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1e3;
    if (!isRecent) {
      console.log(
        `[PERSISTENCE] Saved state for session ${sessionId} is too old, deleting...`
      );
      await redis.del(key);
      return null;
    }
    console.log(`[PERSISTENCE] Project state loaded for session ${sessionId}`);
    return state;
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error loading project state for session ${sessionId}:`,
      error
    );
    return null;
  }
}
async function saveProjectState(sessionId, project, tasks) {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    const state = {
      lastActivity: Date.now(),
      project,
      sessionId,
      tasks,
      timestamp: Date.now()
    };
    await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(state));
    console.log(`[PERSISTENCE] Project state saved for session ${sessionId}`);
  } catch (error) {
    console.error(
      `[PERSISTENCE] Error saving project state for session ${sessionId}:`,
      error
    );
    throw error;
  }
}

export {
  clearSessionState,
  isRecoveryNeeded,
  loadProjectState,
  saveProjectState
};
