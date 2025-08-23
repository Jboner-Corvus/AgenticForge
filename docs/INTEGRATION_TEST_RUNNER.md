# AgenticForge Integration Test Runner

## Overview

The Integration Test Runner is a comprehensive tool for executing all integration tests in the AgenticForge system sequentially. It provides detailed reporting, error handling, and supports various execution modes.

## Features

- Sequential execution of all integration tests
- Detailed reporting with pass/fail statistics
- Configurable test execution modes
- Error handling and retry logic
- Comprehensive logging
- Integration with existing test infrastructure

## Usage

### Running All Integration Tests

```bash
# From the root directory
./integration-test-runner.sh

# Or using pnpm
pnpm test:integration:runner
```

### Running Specific Test Suites

```bash
# Run only core package tests
./integration-test-runner.sh --core-only

# Run only UI package tests
./integration-test-runner.sh --ui-only

# Run only end-to-end tests
./integration-test-runner.sh --e2e-only

# Run only script-based tests
./integration-test-runner.sh --scripts-only
```

### Verbose Mode

```bash
# Enable verbose output for debugging
./integration-test-runner.sh --verbose
```

## Test Categories

The integration test runner executes tests in the following categories:

1. **Core Package Integration Tests**
   - API integration tests
   - Agent integration tests
   - Redis integration tests
   - PostgreSQL integration tests

2. **UI Package Integration Tests**
   - Frontend component integration tests

3. **End-to-End Tests**
   - Complete system integration tests

4. **Script-Based Tests**
   - Agent capability tests
   - Canvas and todo list tests

## Configuration

The test runner can be configured using the following environment variables:

- `TEST_TIMEOUT`: Maximum time (in seconds) for each test (default: 300)
- `MAX_RETRIES`: Number of retries for failed tests (default: 2)

## Output

The test runner generates the following output:

- Console output with real-time test results
- Detailed log files in `integration-test-logs/`
- Summary report in `integration-test-logs/integration-test-report.txt`

## Prerequisites

Before running the integration tests, ensure that:

1. Docker is installed and running
2. All required services are started (`./run-v2.sh start`)
3. Required containers (Redis, PostgreSQL) are running

## Troubleshooting

If tests fail, check:

1. Service status: `./run-v2.sh status`
2. Container status: `docker compose ps`
3. Detailed logs in `integration-test-logs/`
4. Individual test logs for specific failures

## Adding New Tests

To add new integration tests:

1. Add the test to the appropriate category function in the script
2. Follow the existing pattern for test execution and reporting
3. Ensure proper error handling and logging