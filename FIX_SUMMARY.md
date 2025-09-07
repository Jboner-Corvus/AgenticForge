# Fixes for Unhandled Rejection and GitHub API Issues

## Issue 1: Unhandled Rejection Causing Server Crashes

### Problem

The server was crashing with "Unhandled rejection caught!" errors when processing user messages. This was causing the process to exit and restart.

### Root Cause

The worker process was not properly handling all asynchronous operations, leading to unhandled promise rejections that triggered the global error handler in webServer.ts.

### Solution

1. **Enhanced Error Handling in Worker**:
   - Added try-catch blocks around the process-message job handler in worker.ts
   - Improved error handling in the processJob function with specific try-catch blocks for different operations
   - Added better error handling for Redis publish operations in the finally block

2. **Improved Error Handling in Web Server**:
   - Added try-catch around job queue operations in the /api/chat endpoint
   - Modified global error handlers to allow for graceful shutdown with a small delay

3. **Better Error Propagation**:
   - Ensured errors are properly logged with context before being re-thrown
   - Added specific error handling for known error types (AppError, UserError)

## Issue 2: GitHub API Network Resilience

### Problem

The VersionService was failing when the GitHub API was temporarily unavailable, causing update checks to fail.

### Root Cause

The GitHub API calls had no retry mechanism and could fail due to temporary network issues or API rate limiting.

### Solution

1. **Added Retry Logic**:
   - Implemented retry mechanism with exponential backoff (up to 3 attempts)
   - Added timeout handling for fetch requests (10 seconds)
   - Improved error logging to show attempt numbers and specific errors

2. **Enhanced Error Handling**:
   - Added better error messages for failed API calls
   - Maintained backward compatibility by still throwing AppError when all retries fail

## Files Modified

1. `packages/core/src/worker.ts`:
   - Added try-catch around job processing
   - Improved error handling in processJob function
   - Added specific error handling for summarization and Redis operations

2. `packages/core/src/webServer.ts`:
   - Added try-catch around job queue operations in /api/chat endpoint
   - Modified global error handlers for graceful shutdown

3. `packages/core/src/modules/version/VersionService.ts`:
   - Added retry logic with exponential backoff for GitHub API calls
   - Added timeout handling for fetch requests
   - Improved error logging

## Testing

- Code has been linted and compiled successfully
- No breaking changes introduced
- Error handling is more robust and informative

These changes should prevent the server from crashing due to unhandled rejections and make the application more resilient to temporary network issues with the GitHub API.
