# AgenticForge Test Script Improvements

## Summary of Changes

### 1. Fixed run-tests.sh Script
- **Issue**: Directory navigation bug where the script tried to `cd tests` when already in the tests directory
- **Fix**: Corrected the directory paths for direct command execution
- **Improvement**: Added proper file existence checks before execution

### 2. Enhanced test-canvas-todo.sh Script
- **Added worker status checking**: Script now verifies that AgenticForge services and worker are running before executing tests
- **Improved error handling**: Better error messages and failure reporting
- **Robust job completion tracking**: Added proper job status polling with timeout handling
- **Enhanced logging**: Better test result reporting with pass/fail counters

### 3. Enhanced test-agent-capabilities.sh Script
- **Added worker status checking**: Script now verifies that AgenticForge services and worker are running
- **Improved job completion tracking**: Added proper job status polling with timeout handling
- **Better error reporting**: More detailed error messages for debugging

## Recommendations for Running Tests Successfully

### 1. Ensure Services Are Running
Before running tests, make sure all AgenticForge services are running:
```bash
cd /home/demon/agentforge/AgenticForge2/AgenticForge
./run.sh status
```

If services are not running, start them:
```bash
./run.sh start
```

### 2. Check Worker Status
Ensure the worker process is running:
```bash
ps aux | grep worker
```

If the worker is not running or needs to be restarted:
```bash
./run.sh restart-worker
```

### 3. Verify LLM API Keys
Check that valid LLM API keys are configured in the .env file:
```bash
grep -E "(LLM_API_KEY|GEMINI|OPENAI)" .env
```

If keys are missing or expired, update them in the web interface or .env file.

### 4. Run Tests
After ensuring all services are running properly, execute tests:

#### Interactive Mode:
```bash
./run-tests.sh
```

#### Direct Execution:
```bash
# Run canvas & todo tests only
./run-tests.sh canvas

# Run full agent capability tests
./run-tests.sh full
```

## Troubleshooting Common Issues

### 1. Tests Timing Out
- **Cause**: Worker is busy with other tasks or LLM API quota exceeded
- **Solution**: Wait for current jobs to complete or restart the worker

### 2. Authentication Errors
- **Cause**: Missing or invalid AUTH_TOKEN in .env file
- **Solution**: Verify the AUTH_TOKEN is correctly set in .env

### 3. API Connection Issues
- **Cause**: Services not running or incorrect API URLs
- **Solution**: Verify services are running and check API_BASE_URL configuration

### 4. LLM API Quota Issues
- **Cause**: Exceeded API quota for the configured LLM provider
- **Solution**: Wait for quota reset or configure alternative API keys

## Best Practices

1. **Run tests when system is not busy** to avoid timeouts
2. **Monitor worker logs** during test execution to identify issues
3. **Check test logs** in `tests/agent-test-logs/` for detailed results
4. **Restart worker** between test runs if experiencing consistent failures
5. **Update LLM API keys** regularly to avoid quota issues