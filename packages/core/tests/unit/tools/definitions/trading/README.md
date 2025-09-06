# Trading Tools Test Suite

This directory contains comprehensive tests for AgenticForge's trading functionality, focusing on the Alpha Vantage financial data tools.

## Test Structure

- `trading-tools-test.sh` - Bash script with comprehensive trading tool tests
- `trading-test-runner.ts` - Node.js wrapper for running the bash tests
- `trading-tools.test.ts` - Unit tests to verify the test infrastructure

## Available Tests

1. **Alpha Vantage Ping Test** - Verifies connectivity to Alpha Vantage API
2. **Global Quote Test** - Tests fetching current price and volume for stocks
3. **Finance Tool Quote Test** - Tests the composite finance tool for quotes
4. **Time Series Daily Test** - Tests fetching historical daily data
5. **Symbol Search Test** - Tests searching for stock symbols
6. **Technical Analysis Test** - Tests RSI calculation
7. **Composite Trading Analysis** - Tests a complete workflow with multiple tools
8. **Forex Data Test** - Tests foreign exchange rate data
9. **Cryptocurrency Data Test** - Tests cryptocurrency data
10. **News Sentiment Test** - Tests financial news sentiment analysis

## Running the Tests

### Using the Test Runner Script

```bash
# From the core package directory
cd packages/core
node tests/unit/tools/definitions/trading/trading-test-runner.ts
```

### Running the Bash Test Script Directly

```bash
# From the core package directory
cd packages/core
./tests/unit/tools/definitions/trading/trading-tools-test.sh
```

### Running with the Integration Test Runner

```bash
# From the project root
./integration-test-runner.sh --trading-tests
```

## Prerequisites

1. AgenticForge services must be running (`./run.sh start`)
2. Alpha Vantage API key must be configured in `.env` file:
   ```env
   ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```
3. Worker process must be running (`./run.sh restart-worker`)

## Test Output

The test script provides colored output:
- ✅ Green: Passed tests
- ❌ Red: Failed tests
- ⏳ Yellow: In-progress operations
- 🤖 Blue: Test descriptions

## Adding New Tests

To add new tests:
1. Add a new function in `trading-tools-test.sh` following the existing pattern
2. Call the function in the `main()` function
3. Update the test count tracking variables
4. Add corresponding unit tests in `trading-tools.test.ts` if needed

## Troubleshooting

If tests fail:
1. Verify AgenticForge services are running
2. Check that your Alpha Vantage API key is valid and configured
3. Ensure network connectivity to Alpha Vantage API
4. Check `worker.log` for detailed error information