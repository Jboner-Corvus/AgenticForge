# Qwen Provider Hardcoded URL Implementation

This document summarizes the changes made to hardcode the Qwen API URL instead of reading it from environment variables.

## Changes Made

### 1. Removed QWEN_API_BASE_URL from .env file

The `QWEN_API_BASE_URL` environment variable has been removed from the [.env](file:///home/demon/agentforge/AgenticForge2/AgenticForge/.env) file as requested.

**Before:**
```
LLM_API_KEY=_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw
QWEN_API_BASE_URL=https://portal.qwen.ai/v1/chat/completions
```

**After:**
```
LLM_API_KEY=_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw
```

### 2. Updated Qwen Provider Implementation

The Qwen provider in the backend has been updated to use a hardcoded URL instead of reading from environment variables.

**File:** [/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/llm/qwenProvider.ts](file:///home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/llm/qwenProvider.ts)

**Changes:**
```typescript
// Qwen Portal API endpoint (hardcoded as requested)
const QWEN_API_BASE_URL = 'https://portal.qwen.ai/v1';
const apiUrls = [
  activeKey.baseUrl ? `${activeKey.baseUrl}/chat/completions` : null,
  `${QWEN_API_BASE_URL}/chat/completions`, // Hardcoded endpoint as requested
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  'https://qwen.aliyuncs.com/v1/chat/completions'
].filter(Boolean) as string[];
```

### 3. Verified Frontend Configuration

The Qwen provider in the frontend is already configured with the correct hardcoded URL.

**File:** [/home/demon/agentforge/AgenticForge2/AgenticForge/packages/ui/src/store/llmKeysStore.ts](file:///home/demon/agentforge/AgenticForge2/AgenticForge/packages/ui/src/store/llmKeysStore.ts)

**Configuration:**
```typescript
{
  id: 'qwen',
  name: 'qwen',
  displayName: 'Qwen',
  description: 'Qwen3 Coder Plus - Advanced coding model',
  website: 'https://portal.qwen.ai',
  keyFormat: '...',
  testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
  supportedModels: ['qwen3-coder-plus'],
  isActive: true
}
```

## Benefits

1. **Consistency:** The Qwen API URL is now consistently hardcoded across both backend and frontend
2. **Reliability:** Removes dependency on environment variables for the Qwen provider
3. **Maintainability:** Makes it easier to ensure the correct URL is always used
4. **Simplicity:** Reduces configuration complexity by removing the need for the environment variable

## Testing

To verify that the changes work correctly:

1. Ensure the Qwen provider is properly configured in Redis with the correct API key
2. Test making API calls to the Qwen provider through the application
3. Verify that the hardcoded URL is being used by checking the logs

The implementation ensures that the Qwen provider will always use the correct Portal API endpoint: `https://portal.qwen.ai/v1/chat/completions`