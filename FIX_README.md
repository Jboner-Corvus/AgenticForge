# AgenticForge Worker Fix Scripts

This directory contains scripts to diagnose and fix common issues with the AgenticForge worker processes.

## Scripts Overview

### `test_api_keys.ts`
Tests all Gemini API keys configured in the `.env` file to identify any invalid keys.

### `test_postgres.ts`
Tests the PostgreSQL connection to ensure the database is accessible.

### `fix_worker_issues.ts`
A comprehensive script that:
- Checks Docker service status
- Restarts services if needed
- Kills existing worker processes cleanly
- Starts new worker processes with proper configuration

### `test_fixes.sh`
A bash script that verifies all fixes are working correctly.

### `FIX_SUMMARY.md`
Detailed summary of issues, root causes, and fixes implemented.

## Usage

1. **Test API Keys**:
   ```bash
   npx ts-node test_api_keys.ts
   ```

2. **Test PostgreSQL Connection**:
   ```bash
   npx ts-node test_postgres.ts
   ```

3. **Apply All Fixes**:
   ```bash
   npx ts-node fix_worker_issues.ts
   ```

4. **Verify Fixes**:
   ```bash
   ./test_fixes.sh
   ```

## Troubleshooting

If issues persist after running the fix scripts:

1. Check the `worker.log` file for detailed error messages
2. Ensure all Docker services are running properly with `docker compose ps`
3. Verify network connectivity between host and Docker containers
4. Update any invalid API keys in the `.env` file