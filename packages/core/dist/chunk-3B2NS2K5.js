import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/utils/canvasUtils.ts
init_esm_shims();
function sendToCanvas(jobId, content, contentType = "html") {
  try {
    const parsedContent = JSON.parse(content);
    if (parsedContent.isAgentInternal === true) {
      console.log(`[CANVAS] Skipping agent-internal content for job ${jobId}`);
      return;
    }
  } catch (_e) {
  }
  const channel = `job:${jobId}:events`;
  const message = JSON.stringify({
    content,
    contentType,
    type: "agent_canvas_output"
  });
  console.log(
    `[CANVAS] Attempting to send to canvas for job ${jobId}, type: ${contentType}, content length: ${content.length}`
  );
  console.log(`[CANVAS] Channel: ${channel}`);
  console.log(`[CANVAS] Message:`, message);
  const result = getRedisClientInstance().publish(channel, message);
  console.log(`[CANVAS] Redis publish result:`, result);
  console.log(`[CANVAS] Content sent to canvas for job ${jobId}`);
}

export {
  sendToCanvas
};
