import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  LlmKeyErrorType,
  LlmKeyManager
} from "./chunk-GWM7R3BS.js";
import {
  getRedisClientInstance
} from "./chunk-HKREBWDH.js";
import {
  getLogger
} from "./chunk-ODN6V7GO.js";
import {
  config,
  getConfig
} from "./chunk-W2OHWP3M.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/utils/llmProvider.ts
init_esm_shims();

// src/modules/llm/llm-types.ts
init_esm_shims();
var LlmError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "LlmError";
  }
};

// src/modules/llm/qwenProvider.ts
init_esm_shims();

// src/utils/LlmError.ts
init_esm_shims();
var LlmError2 = class extends Error {
  constructor(message) {
    super(message);
    this.name = "LlmError";
  }
};

// src/modules/llm/qwenProvider.ts
var QwenProvider = class {
  getErrorType(statusCode, errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (errorBody.includes("invalid_api_key") || errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  isResponseTruncated(content) {
    const truncatedIndicators = ["...}", '..."', "...]", "...\n", "... "];
    return truncatedIndicators.some(
      (indicator) => content.endsWith(indicator) && content.length > 500
    );
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "QwenProvider" });
    let activeKey = null;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || config.LLM_MODEL_NAME,
        apiProvider: "qwen",
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("qwen");
    }
    if (!activeKey) {
      const errorMessage = "No Qwen API key available.";
      log.error(errorMessage);
      throw new LlmError2(errorMessage);
    }
    log.info(
      {
        apiKeyPrefix: activeKey.apiKey.substring(0, 10) + "...",
        apiModel: activeKey.apiModel,
        apiProvider: activeKey.apiProvider
      },
      "Using Qwen API key for request"
    );
    const QWEN_API_BASE_URL = "https://portal.qwen.ai/v1";
    const apiUrls = [
      activeKey.baseUrl ? `${activeKey.baseUrl}/chat/completions` : null,
      `${QWEN_API_BASE_URL}/chat/completions`,
      // Hardcoded endpoint as requested
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      "https://qwen.aliyuncs.com/v1/chat/completions"
    ].filter(Boolean);
    const qwenMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "assistant"
    }));
    if (systemPrompt) {
      qwenMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      max_tokens: 2e3,
      messages: qwenMessages,
      model: modelName || activeKey.apiModel || "qwen3-coder-plus"
    };
    const body = JSON.stringify(requestBody);
    let lastError = null;
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 500;
    const MAX_DELAY_MS = 5e3;
    for (const apiUrl of apiUrls) {
      log.info(`Trying Qwen API endpoint: ${apiUrl}`);
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            const delayMs = Math.min(
              INITIAL_DELAY_MS * Math.pow(2, attempt - 1),
              MAX_DELAY_MS
            );
            log.info(
              `Adding delay of ${delayMs}ms before Qwen API call (attempt ${attempt + 1}/${MAX_RETRIES})`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
          log.info(
            `[LLM CALL] Sending request to model: ${activeKey.apiModel} via ${activeKey.apiProvider} at ${apiUrl} (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6e4);
          const response = await fetch(apiUrl, {
            body,
            headers: {
              Authorization: `Bearer ${activeKey.apiKey}`,
              "Content-Type": "application/json"
            },
            method: "POST",
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            const errorBody = await response.text();
            const errorMessage = `Qwen API request failed with status ${response.status}: ${errorBody}`;
            log.error({ errorBody, status: response.status }, errorMessage);
            const errorType = this.getErrorType(response.status, errorBody);
            if (errorType === LlmKeyErrorType.PERMANENT) {
              await LlmKeyManager.markKeyAsBad(
                activeKey.apiProvider,
                activeKey.apiKey,
                errorType
              );
              throw new LlmError2(errorMessage);
            } else if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2(errorMessage);
              log.warn(
                `Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              await LlmKeyManager.markKeyAsBad(
                activeKey.apiProvider,
                activeKey.apiKey,
                errorType
              );
              throw new LlmError2(errorMessage);
            }
          }
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content === void 0 || content === null) {
            log.error(
              { response: data },
              "Invalid response structure from Qwen API"
            );
            const errorType = this.getErrorType(
              response.status,
              JSON.stringify(data)
            );
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2(
                "Invalid response structure from Qwen API. The model may have returned an empty response."
              );
              log.warn(
                `Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              await LlmKeyManager.markKeyAsBad(
                activeKey.apiProvider,
                activeKey.apiKey,
                errorType
              );
              throw new LlmError2(
                "Invalid response structure from Qwen API. The model may have returned an empty response."
              );
            }
          }
          if (this.isResponseTruncated(content)) {
            log.warn(
              { content },
              "Qwen API response appears to be truncated. Retrying..."
            );
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2(
                "Qwen API response appears to be truncated. Retrying..."
              );
              continue;
            } else {
              throw new LlmError2(
                "Qwen API response appears to be truncated after all retries."
              );
            }
          }
          const estimatedTokens = messages.reduce(
            (sum, msg) => sum + msg.parts.reduce(
              (partSum, part) => partSum + (part.text?.length || 0),
              0
            ),
            0
          ) / 4;
          log.info(
            {
              apiKey: activeKey.apiKey.substring(0, 5) + "...",
              estimatedTokens,
              provider: activeKey.apiProvider
            },
            "LLM API key status reset."
          );
          return content;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            log.error("Qwen API request timed out");
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2("Qwen API request timed out");
              log.warn(
                `Timeout error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              throw new LlmError2(
                "Qwen API request timed out after all retries"
              );
            }
          } else {
            log.error({ error }, "Error calling Qwen API");
            if (attempt < MAX_RETRIES - 1) {
              lastError = error;
              log.warn(
                `Error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              throw error;
            }
          }
        }
      }
    }
    throw lastError || new LlmError2("All Qwen API endpoints failed");
  }
};

// src/utils/gpt5Provider.ts
init_esm_shims();
var Gpt5Provider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName, gpt5Options) {
    const log = getLogger().child({ module: "Gpt5Provider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "openai",
        // GPT-5 is an OpenAI model
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("openai");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.openai.com/v1/responses";
    const gpt5Messages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "assistant"
    }));
    const inputContent = gpt5Messages.map((m) => m.content).join("\n");
    const requestBody = {
      input: inputContent,
      model: modelName || getConfig().LLM_MODEL_NAME
    };
    if (gpt5Options?.reasoning) {
      requestBody.reasoning = gpt5Options.reasoning;
    }
    if (gpt5Options?.text) {
      requestBody.text = gpt5Options.text;
    }
    if (systemPrompt) {
      requestBody.system_prompt = systemPrompt;
    }
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le GPT-5 : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `GPT-5 API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.output;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from GPT-5 API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from GPT-5 API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from GPT-5");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with GPT-5.");
    }
  }
};

// src/utils/llmProvider.ts
var AnthropicProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("authentication_error")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "AnthropicProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "anthropic",
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("anthropic");
    }
    if (!activeKey) {
      const errorMessage = "No Anthropic API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.anthropic.com/v1/messages";
    const anthropicMessages = messages.map((msg) => {
      let role = "user";
      if (msg.role === "model") {
        role = "assistant";
      } else if (msg.role === "tool") {
        return {
          content: `Tool output: ${msg.parts.map((p) => p.text).join("")}`,
          role: "user"
        };
      }
      return {
        content: msg.parts.map((p) => p.text).join(""),
        role
      };
    });
    const requestBody = {
      max_tokens: 4096,
      // A reasonable default for Anthropic models
      messages: anthropicMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
    };
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          "anthropic-version": "2023-06-01",
          // Required Anthropic API version
          "Content-Type": "application/json",
          "x-api-key": activeKey.apiKey
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Anthropic API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.content?.[0]?.text;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Anthropic API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Anthropic API. The model may have returned an empty response."
        );
      }
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;
      log.info(`Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
      getRedisClientInstance().incrby("leaderboard:tokensSaved", totalTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      getRedisClientInstance().hset("session:tokens:latest", {
        "input_tokens": inputTokens,
        "output_tokens": outputTokens,
        "total_tokens": totalTokens,
        "timestamp": Date.now()
      }).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to store session token stats in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var GrokProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "GrokProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "grok",
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("grok");
    }
    if (!activeKey) {
      const errorMessage = "No Grok API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.grok.com/v1/chat/completions";
    const grokMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "assistant"
    }));
    if (systemPrompt) {
      grokMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: grokMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Grok API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Grok API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Grok API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var HuggingFaceProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Authorization header is invalid")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "HuggingFaceProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "huggingface",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("huggingface");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const baseUrl = activeKey.baseUrl || "https://api-inference.huggingface.co";
    const apiUrl = `${baseUrl}/models/${modelName || getConfig().LLM_MODEL_NAME}`;
    const requestBody = {
      inputs: messages.map((msg) => msg.parts.map((p) => p.text).join("")).join("\n"),
      parameters: {
        max_new_tokens: 4096
        // A reasonable default for HuggingFace models
      }
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `HuggingFace API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data?.[0]?.generated_text;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from HuggingFace API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from HuggingFace API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var MistralProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "MistralProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "mistral",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("mistral");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.mistral.ai/v1/chat/completions";
    const mistralMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "model"
    }));
    if (systemPrompt) {
      mistralMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: mistralMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Mistral API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Mistral API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Mistral API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var OpenAIProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "OpenAIProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "openai",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("openai");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.openai.com/v1/chat/completions";
    const openaiMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "model"
    }));
    if (systemPrompt) {
      openaiMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: openaiMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenAI API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from OpenAI API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from OpenAI API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var OpenRouterProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "OpenRouterProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "openrouter",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("openrouter");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://openrouter.ai/api/v1/chat/completions";
    const openRouterMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "model"
    }));
    if (systemPrompt) {
      openRouterMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: openRouterMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      await new Promise(
        (resolve) => setTimeout(resolve, getConfig().LLM_REQUEST_DELAY_MS)
      );
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenRouter API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from OpenRouter API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from OpenRouter API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var ProviderFallbackManager = class {
  static failureCounts = /* @__PURE__ */ new Map();
  static FALLBACK_PROVIDERS = ["openai", "anthropic", "openrouter", "mistral", "grok"];
  static MAX_FAILURES_BEFORE_FALLBACK = 5;
  static getFallbackProvider(originalProvider, _modelName) {
    for (const fallbackProvider of this.FALLBACK_PROVIDERS) {
      if (fallbackProvider !== originalProvider) {
        try {
          getLogger().info(`Attempting to fallback from ${originalProvider} to ${fallbackProvider}`);
          return fallbackProvider;
        } catch (error) {
          getLogger().warn(`Fallback provider ${fallbackProvider} not available: ${error}`);
        }
      }
    }
    getLogger().warn(`No suitable fallback provider found for ${originalProvider}`);
    return originalProvider;
  }
  static getMaxFailuresBeforeFallback() {
    return this.MAX_FAILURES_BEFORE_FALLBACK;
  }
  static recordFailure(providerName) {
    const currentCount = this.failureCounts.get(providerName) || 0;
    this.failureCounts.set(providerName, currentCount + 1);
    getLogger().debug(`Provider ${providerName} failure count: ${currentCount + 1}`);
  }
  static recordSuccess(providerName) {
    if (this.failureCounts.has(providerName)) {
      this.failureCounts.set(providerName, 0);
      getLogger().debug(`Reset failure count for provider ${providerName} after successful call`);
    }
  }
  static shouldFallback(providerName) {
    const failureCount = this.failureCounts.get(providerName) || 0;
    return failureCount >= this.MAX_FAILURES_BEFORE_FALLBACK;
  }
};
var GeminiProvider = class _GeminiProvider {
  // Invalid response patterns
  static INVALID_RESPONSE_PATTERNS = [
    "currently unable to process your request",
    "quota.*exceeded",
    "free-tier quota",
    "Please try again once the quota has reset",
    "I can't provide",
    "I cannot assist",
    "I'm unable to help",
    "I apologize, but I cannot",
    "I don't have the ability",
    "As an AI language model",
    "I'm just an AI",
    "I'm an AI assistant",
    "I can't do that",
    "I'm not able to",
    "I don't have access to",
    "I cannot generate",
    "I cannot create",
    "ERROR:",
    "FAILED:",
    "503 Service Temporarily Unavailable",
    "502 Bad Gateway",
    "500 Internal Server Error",
    "Connection timeout",
    "Request timeout"
  ];
  // Add rate limiting tracking
  static lastRequestTime = 0;
  static lastResetTime = Date.now();
  static MAX_RETRIES = 5;
  // Augmenté pour plus de robustesse
  static requestCount = 0;
  static RETRY_DELAYS = [2e3, 4e3, 8e3, 15e3, 3e4];
  // Exponential backoff plus long
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    return this.getLlmResponseWithRetry(messages, systemPrompt, apiKey, modelName, 0);
  }
  async getLlmResponseWithRetry(messages, systemPrompt, apiKey, modelName, retryCount = 0) {
    const log = getLogger().child({ module: "GeminiProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "gemini",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("gemini");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const now = Date.now();
    const timeSinceLastReset = now - _GeminiProvider.lastResetTime;
    if (timeSinceLastReset > 6e4) {
      _GeminiProvider.requestCount = 0;
      _GeminiProvider.lastResetTime = now;
      log.debug("Rate limit counter reset");
    }
    const MAX_REQUESTS_PER_MINUTE = 30;
    if (_GeminiProvider.requestCount >= MAX_REQUESTS_PER_MINUTE) {
      const waitTime = 6e4 - timeSinceLastReset;
      log.warn(`Rate limit exceeded (${_GeminiProvider.requestCount}/${MAX_REQUESTS_PER_MINUTE}). Waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      _GeminiProvider.requestCount = 0;
      _GeminiProvider.lastResetTime = Date.now();
    }
    const timeSinceLastRequest = now - _GeminiProvider.lastRequestTime;
    const minDelay = getConfig().LLM_REQUEST_DELAY_MS || 1e3;
    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      log.info(`Rate limiting: Adding ${delay}ms delay before Gemini API call`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    _GeminiProvider.requestCount++;
    _GeminiProvider.lastRequestTime = Date.now();
    const rateStatus = _GeminiProvider.requestCount >= MAX_REQUESTS_PER_MINUTE * 0.8 ? "\u26A0\uFE0F HIGH" : "\u2705 OK";
    log.info(
      `Gemini API request #${_GeminiProvider.requestCount}/${MAX_REQUESTS_PER_MINUTE} in current minute ${rateStatus}`
    );
    const baseUrl = activeKey.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    const apiUrl = `${baseUrl}/models/${modelName || getConfig().LLM_MODEL_NAME}:generateContent`;
    log.info({
      baseUrl,
      modelName: modelName || getConfig().LLM_MODEL_NAME,
      apiUrl,
      keyProvider: activeKey.apiProvider,
      hasBaseUrl: !!activeKey.baseUrl
    }, "\u{1F517} Gemini API URL construction");
    const maxMessages = getConfig().GEMINI_MAX_HISTORY_LENGTH || 30;
    const maxMessageLength = 8e3;
    const maxTotalLength = 5e4;
    let currentTotalLength = 0;
    const geminiMessages = messages.slice(-maxMessages).map((msg) => {
      const messageText = msg.parts.map((p) => p.text).join("");
      const truncatedText = messageText.length > maxMessageLength ? messageText.substring(0, maxMessageLength) + "...[truncated]" : messageText;
      if (currentTotalLength + truncatedText.length > maxTotalLength) {
        return null;
      }
      currentTotalLength += truncatedText.length;
      let role = msg.role;
      let parts = [{ text: truncatedText }];
      if (role === "tool") {
        role = "user";
        parts = [
          {
            text: `Tool output: ${truncatedText}`
          }
        ];
      }
      return { parts, role };
    }).filter((msg) => msg !== null);
    if (systemPrompt) {
      const firstUserMessage = geminiMessages.find(
        (msg) => msg.role === "user"
      );
      if (firstUserMessage) {
        firstUserMessage.parts.unshift({ text: systemPrompt + "\n" });
      } else {
        geminiMessages.unshift({
          parts: [{ text: systemPrompt }],
          role: "user"
        });
      }
    }
    const requestBody = {
      contents: geminiMessages
    };
    const body = JSON.stringify(requestBody);
    log.info({
      messageCount: geminiMessages.length,
      totalCharacters: currentTotalLength,
      maxMessages,
      maxMessageLength,
      maxTotalLength,
      bodySize: body.length
    }, "\u{1F4CA} Gemini request size analysis");
    try {
      const retryInfo = retryCount > 0 ? ` (retry ${retryCount}/${_GeminiProvider.MAX_RETRIES})` : "";
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}${retryInfo}`
      );
      const controller = new AbortController();
      const timeoutMs = getConfig().GEMINI_REQUEST_TIMEOUT_MS || 45e3;
      const timeoutId = setTimeout(
        () => controller.abort(),
        timeoutMs
      );
      log.info(`Setting timeout to ${timeoutMs}ms for Gemini API call`);
      const response = await fetch(apiUrl, {
        body,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": activeKey.apiKey
        },
        method: "POST",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Gemini API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      log.debug({
        headers: Object.fromEntries(response.headers.entries()),
        response: data,
        status: response.status,
        statusText: response.statusText
      }, "Raw Gemini API response");
      let content;
      log.debug({
        candidates: data.candidates,
        candidatesType: typeof data.candidates,
        hasCandidates: !!data.candidates,
        hasPromptFeedback: !!data.promptFeedback,
        keys: Object.keys(data || {})
      }, "Response structure analysis");
      if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const firstCandidate = data.candidates[0];
        log.debug({ firstCandidate }, "First candidate structure");
        if (firstCandidate.content?.parts && Array.isArray(firstCandidate.content.parts) && firstCandidate.content.parts.length > 0) {
          content = firstCandidate.content.parts.map((part) => part.text || "").filter((text) => text.trim().length > 0).join("");
          log.debug("Extracted content from candidates[0].content.parts");
          if (!content || content.trim().length === 0) {
            log.warn("All content parts were empty, treating as empty response");
            content = void 0;
          }
        } else if (firstCandidate.finishReason === "UNEXPECTED_TOOL_CALL" && firstCandidate.content?.parts?.[0]?.text) {
          content = firstCandidate.content.parts[0].text;
          log.warn("UNEXPECTED_TOOL_CALL finish reason encountered, but content is available");
        } else if (firstCandidate.finishReason === "UNEXPECTED_TOOL_CALL") {
          log.warn("UNEXPECTED_TOOL_CALL finish reason encountered without content. This may indicate the model attempted to make tool calls directly.");
          content = "The model attempted to make tool calls directly, which is not supported in this context. Please try rephrasing your request or using available tools explicitly.";
        } else {
          log.warn(`Candidate has no valid content. Finish reason: ${firstCandidate.finishReason || "undefined"}`);
          if (firstCandidate.content && typeof firstCandidate.content === "object") {
            const altContent = JSON.stringify(firstCandidate.content);
            if (altContent.length > 10) {
              content = `Model response (raw): ${altContent}`;
              log.info("Using alternative content extraction");
            } else {
              content = void 0;
            }
          } else {
            content = void 0;
          }
        }
      } else if (data.candidates && Array.isArray(data.candidates) && data.candidates.length === 0) {
        log.warn("Gemini API returned empty candidates array");
        content = void 0;
      } else if (data.promptFeedback) {
        log.warn("Gemini API returned promptFeedback instead of candidates. This may indicate content safety issues.");
        content = "The request was blocked due to safety concerns. Please try rephrasing your request with different content.";
      } else {
        log.warn("Gemini API returned response without candidates field.");
        if (data.candidates) {
          log.debug({ candidates: data.candidates }, "Candidates field exists but is not an array or is empty");
        }
        const maxRetries = getConfig().LLM_MAX_RETRIES || 5;
        if (retryCount < maxRetries) {
          const baseRetryDelay = getConfig().LLM_RETRY_DELAY_BASE_MS || 2e3;
          log.warn(`Gemini returned empty response, retrying (${retryCount + 1}/${maxRetries})`);
          const jitter = Math.random() * 1e3;
          const exponentialDelay = baseRetryDelay * Math.pow(2, retryCount) + jitter;
          log.info(`Retrying Gemini API call in ${Math.round(exponentialDelay)}ms with exponential backoff`);
          await new Promise((resolve) => setTimeout(resolve, exponentialDelay));
          return this.getLlmResponseWithRetry(messages, systemPrompt, apiKey, modelName, retryCount + 1);
        }
        if (data && typeof data === "object") {
          const responseStr = JSON.stringify(data);
          if (responseStr.length > 50) {
            content = `Model response (fallback): ${responseStr.substring(0, 500)}...`;
            log.info("Using fallback content extraction from empty response");
          } else {
            content = "The model did not return a valid response after multiple attempts. Please try again or rephrase your request.";
          }
        } else {
          content = "The model did not return a valid response after multiple attempts. Please try again or rephrase your request.";
        }
      }
      if (content === void 0 || content === null || content && content.trim() === "") {
        log.error(
          { response: data },
          "Invalid response structure from Gemini API - empty or undefined content"
        );
        const maxRetries = getConfig().LLM_MAX_RETRIES || 5;
        if (retryCount < maxRetries) {
          const baseRetryDelay = getConfig().LLM_RETRY_DELAY_BASE_MS || 2e3;
          log.warn(`Gemini returned invalid/empty content, retrying (${retryCount + 1}/${maxRetries})`);
          const jitter = Math.random() * 1e3;
          const exponentialDelay = baseRetryDelay * Math.pow(2, retryCount) + jitter;
          log.info(`Retrying Gemini API call in ${Math.round(exponentialDelay)}ms due to empty content`);
          await new Promise((resolve) => setTimeout(resolve, exponentialDelay));
          return this.getLlmResponseWithRetry(messages, systemPrompt, apiKey, modelName, retryCount + 1);
        }
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Gemini API after multiple retries. The model consistently returned empty responses."
        );
      }
      let processedContent = content;
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsedJson = JSON.parse(jsonMatch[1].trim());
            if (parsedJson.command) {
              processedContent = JSON.stringify(parsedJson);
              log.info("Successfully extracted JSON from mixed response");
            }
          } catch (parseError) {
            log.warn({ parseError }, "Failed to parse extracted JSON, using original content");
          }
        }
      }
      if (this.isInvalidResponse(processedContent)) {
        log.error({ content: processedContent }, "Gemini API returned invalid/error content");
        const errorType = processedContent.includes("quota") ? LlmKeyErrorType.TEMPORARY : LlmKeyErrorType.TEMPORARY;
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(`Gemini API returned invalid response: ${processedContent.substring(0, 200)}...`);
      }
      content = processedContent;
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      ProviderFallbackManager.recordSuccess(activeKey.apiProvider);
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      const error = _error instanceof Error ? _error : new Error(String(_error));
      log.error({ error, retryCount }, "Failed to get response from LLM");
      const isTimeoutError = error.message.includes("AbortError") || error.message.includes("timeout") || error.message.includes("TIMEOUT") || error.name === "AbortError" || error.message.includes("Request timeout") || error.message.includes("Connection timed out") || error.message.includes("Request timed out") || error.message.includes("ETIMEDOUT");
      const isNetworkError = error.message.includes("network") || error.message.includes("ECONNRESET") || error.message.includes("ETIMEDOUT") || error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed") || error.message.includes("Failed to fetch") || error.message.includes("NetworkError") || error.message.includes("connection") || error.message.includes("socket hang up") || error.message.includes("DNS") || error.message.includes("SSL") || error.message.includes("certificate");
      const isRetryableApiError = error.message.includes("503") || error.message.includes("502") || error.message.includes("504") || error.message.includes("rate limit") || error.message.includes("temporarily unavailable") || error.message.includes("Internal server error") || error.message.includes("Service Unavailable") || error.message.includes("Bad Gateway") || error.message.includes("Gateway Timeout") || error.message.includes("Too Many Requests") || error.message.includes("Server Error") || error.message.includes("Temporary failure");
      const isInvalidResponseError = error.message.includes("invalid response") || error.message.includes("parsing failed") || error.message.includes("JSON") || error.message.includes("malformed") || error.message.includes("Unexpected token") || error.message.includes("SyntaxError");
      const isQuotaError = error.message.includes("quota") || error.message.includes("limit exceeded") || error.message.includes("billing") || error.message.includes("insufficient funds") || error.message.includes("payment required");
      const isAuthError = error.message.includes("unauthorized") || error.message.includes("authentication") || error.message.includes("invalid api key") || error.message.includes("forbidden") || error.message.includes("403") || error.message.includes("401");
      const shouldRetry = (isTimeoutError || isNetworkError || isRetryableApiError) && retryCount < _GeminiProvider.MAX_RETRIES;
      const shouldNotRetry = isInvalidResponseError || isQuotaError || isAuthError;
      if (shouldRetry && !shouldNotRetry) {
        const baseDelay = _GeminiProvider.RETRY_DELAYS[Math.min(retryCount, _GeminiProvider.RETRY_DELAYS.length - 1)];
        const jitter = Math.random() * 1e3;
        const delay = baseDelay + jitter;
        let errorType = "unknown";
        if (isTimeoutError) errorType = "timeout";
        else if (isNetworkError) errorType = "network";
        else if (isRetryableApiError) errorType = "API";
        log.warn(`${errorType} error detected. Retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${_GeminiProvider.MAX_RETRIES})`);
        log.debug({
          error: error.message,
          errorType,
          maxRetries: _GeminiProvider.MAX_RETRIES,
          retryCount: retryCount + 1
        }, "Retry details");
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getLlmResponseWithRetry(messages, systemPrompt, apiKey, modelName, retryCount + 1);
      }
      if (isInvalidResponseError) {
        log.warn("Invalid response error detected - not retrying as this is likely a permanent issue");
        if (activeKey) {
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else if (isQuotaError) {
        log.error("Quota/billing error detected - marking key as permanently disabled");
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(activeKey.apiProvider, activeKey.apiKey, LlmKeyErrorType.PERMANENT);
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else if (isAuthError) {
        log.error("Authentication error detected - marking key as permanently disabled");
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(activeKey.apiProvider, activeKey.apiKey, LlmKeyErrorType.PERMANENT);
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else if (retryCount >= _GeminiProvider.MAX_RETRIES) {
        log.error(`Maximum retry attempts (${_GeminiProvider.MAX_RETRIES}) exceeded. Recording failure for fallback consideration.`);
        if (activeKey) {
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else {
        if (activeKey) {
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      }
      if (activeKey) {
        let errorType = LlmKeyErrorType.TEMPORARY;
        if (isInvalidResponseError) {
          errorType = LlmKeyErrorType.PERMANENT;
        } else if (error.message.includes("quota") || error.message.includes("billing")) {
          errorType = LlmKeyErrorType.PERMANENT;
        } else if (error.message.includes("authentication") || error.message.includes("unauthorized")) {
          errorType = LlmKeyErrorType.PERMANENT;
        }
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
      }
      let errorMessage = `Failed to communicate with the LLM after ${retryCount + 1} attempts`;
      if (isInvalidResponseError) {
        errorMessage += ": Invalid response format from API";
      } else if (isNetworkError) {
        errorMessage += ": Network connectivity issue";
      } else {
        errorMessage += `: ${error.message}`;
      }
      throw new LlmError(errorMessage);
    }
  }
  isInvalidResponse(content) {
    if (content.trim().length < 10) {
      return true;
    }
    const lowerContent = content.toLowerCase();
    return _GeminiProvider.INVALID_RESPONSE_PATTERNS.some((pattern) => {
      const regex = new RegExp(pattern, "i");
      return regex.test(lowerContent);
    });
  }
};
function getLlmProvider(providerName, modelName) {
  let currentLlmProvider;
  let actualProviderName = providerName;
  if (providerName === "openai" && modelName && modelName.startsWith("gpt-5")) {
    return new Gpt5Provider();
  }
  if (ProviderFallbackManager.shouldFallback(providerName)) {
    const fallbackProvider = ProviderFallbackManager.getFallbackProvider(providerName, modelName);
    if (fallbackProvider !== providerName) {
      getLogger().warn(
        `Provider ${providerName} has failed ${ProviderFallbackManager.getMaxFailuresBeforeFallback()} times. Falling back to ${fallbackProvider}.`
      );
      actualProviderName = fallbackProvider;
    }
  }
  let resolvedProviderName = actualProviderName;
  let resolvedModelName = modelName;
  if (actualProviderName.startsWith("gemini-flash-") || actualProviderName.startsWith("gemini-pro-")) {
    resolvedProviderName = "gemini";
    if (actualProviderName.includes("flash")) {
      resolvedModelName = "gemini-2.5-flash";
    } else if (actualProviderName.includes("pro")) {
      resolvedModelName = "gemini-2.5-pro";
    }
    getLogger().info(`Resolved custom provider ${actualProviderName} to ${resolvedProviderName} with model ${resolvedModelName}`);
  }
  switch (resolvedProviderName) {
    case "anthropic":
      currentLlmProvider = new AnthropicProvider();
      break;
    case "gemini":
      currentLlmProvider = new GeminiProvider();
      break;
    case "grok":
      currentLlmProvider = new GrokProvider();
      break;
    case "huggingface":
      currentLlmProvider = new HuggingFaceProvider();
      break;
    case "mistral":
      currentLlmProvider = new MistralProvider();
      break;
    case "openai":
      currentLlmProvider = new OpenAIProvider();
      break;
    case "openrouter":
      currentLlmProvider = new OpenRouterProvider();
      break;
    case "qwen":
      currentLlmProvider = new QwenProvider();
      break;
    default:
      getLogger().warn(
        `Unknown LLM provider requested: ${resolvedProviderName}. Defaulting to GeminiProvider.`
      );
      currentLlmProvider = new GeminiProvider();
      break;
  }
  if (actualProviderName !== providerName) {
    getLogger().info(`Using fallback provider: ${actualProviderName} (requested: ${providerName})`);
  }
  return currentLlmProvider;
}

export {
  LlmError2 as LlmError,
  LlmError as LlmError2,
  ProviderFallbackManager,
  GeminiProvider,
  getLlmProvider
};
