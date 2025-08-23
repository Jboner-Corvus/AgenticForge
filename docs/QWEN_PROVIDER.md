# Qwen Provider Configuration Guide

This document explains how to properly configure and use the Qwen provider in AgenticForge.

## Prerequisites

1. You need a valid Qwen API key from Alibaba Cloud/Qwen Portal
2. Ensure you have access to the Qwen models you want to use

## Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Qwen Provider Configuration
LLM_PROVIDER=qwen                   # Fournisseur IA actuel (qwen/openai/claude/etc.)
LLM_PROVIDER_HIERARCHY=qwen,gemini,openai,anthropic  # Hiérarchie des fournisseurs (fallback)
LLM_MODEL_NAME=qwen3-coder-plus     # Modèle spécifique à utiliser
LLM_API_KEY=your_actual_qwen_api_key_here
QWEN_API_BASE_URL=https://portal.qwen.ai/v1/chat/completions  # Correct Qwen Portal API endpoint
```

### 2. Getting a Qwen API Key

1. Visit [Qwen Portal](https://portal.qwen.ai/)
2. Sign up or log in to your account
3. Navigate to the API Key management section
4. Create a new API key
5. Copy the API key and add it to your `.env` file

## Troubleshooting

### Common Issues

1. **Invalid API Key Error (401)**
   - Verify your API key is correct and hasn't expired
   - Check that you have enabled the Qwen models in your Qwen Portal account
   - Ensure your account has sufficient credits/balance

2. **Connection Timeout**
   - Check your network connection
   - Try using a different Qwen API endpoint
   - Increase the timeout in the provider configuration

3. **Rate Limiting (429)**
   - Reduce the frequency of requests
   - Upgrade your Qwen Portal plan for higher rate limits

### Testing Your Configuration

You can validate your Qwen API key using the provided utility script:

```bash
cd /path/to/AgenticForge
ts-node scripts/validate-qwen-key.ts your_api_key_here
```

Or set the LLM_API_KEY environment variable and run:

```bash
ts-node scripts/validate-qwen-key.ts
```

## Provider Features

The improved Qwen provider includes:

1. **Multiple Endpoint Support**: Automatically tries different Qwen API endpoints including the correct Qwen Portal endpoint
2. **Exponential Backoff**: Implements intelligent retry logic with increasing delays
3. **Better Error Handling**: More precise error categorization (permanent vs temporary)
4. **Improved Performance**: Reduced initial delays and optimized timeout settings
5. **Fallback Mechanism**: Automatically tries alternative endpoints on failure

## Model Selection

Common Qwen models available:

- `qwen3-coder-plus` - Latest coding-focused model
- `qwen3-plus` - General purpose model
- `qwen3-turbo` - Faster, lighter model
- `qwen2.5-coder` - Previous generation coding model

Set your preferred model in the `.env` file:

```env
LLM_MODEL_NAME=qwen3-coder-plus
```

## Performance Optimization

To optimize performance with the Qwen provider:

1. Use a stable internet connection
2. Select the model closest to your region
3. Monitor your API usage to avoid rate limiting
4. Consider caching responses for repeated queries

## Support

If you continue to experience issues:

1. Check the worker logs for detailed error messages
2. Verify your API key and permissions in the Qwen Portal console
3. Contact Qwen support if the issue persists