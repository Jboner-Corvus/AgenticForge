# AgenticForge Testing Framework

This directory contains **agent capability tests** for AgenticForge's AI agent, specifically focusing on validating the agent's ability to create canvases, manage todo lists, forge tools, and execute complex tasks via API.

> **Note**: Development quality checks (lint, TypeScript, format) are handled by the main build system (`./run-v2.sh`) and pnpm scripts, not in this test directory.

## 🧪 Test Scripts

### 1. `../run-tests.sh` - Main Test Launcher (Root Directory)
```bash
# From AgenticForge root directory
../run-tests.sh
```
Convenient launcher with command-line options:
- `../run-tests.sh` - Interactive test menu
- `../run-tests.sh canvas` - Canvas & Todo List Tests (Quick)
- `../run-tests.sh full` - Full Agent Capability Tests
- `../run-tests.sh help` - Show usage help

### 2. `test-runner.sh` - Interactive Test Menu (This Directory)
```bash
./test-runner.sh
```
Main test interface with menu options:
- Canvas & Todo List Tests (Quick)
- Full Agent Capability Tests  
- Custom Message Test
- Check AgenticForge Status
- View Test Logs

### 3. `test-canvas-todo.sh` - Canvas & Todo Focus Tests
```bash
./test-canvas-todo.sh
```
Focused tests for:
- ✅ Todo list creation and management
- ✅ Canvas diagram creation and updates
- ✅ Interactive todo operations
- ✅ Canvas workflow visualization

### 4. `test-agent-capabilities.sh` - Comprehensive API Tests
```bash
./test-agent-capabilities.sh
```
Complete test suite covering:
- 🗣️ Basic agent communication
- 📋 Todo list management
- 🎨 Canvas functionality
- 🛠️ Tool creation and execution
- 💻 Code generation
- 🎯 Planning and task execution
- 💾 Session management
- 🔧 Error handling

## 🔍 Development vs Agent Testing

**This directory (`tests/`)** contains **Agent Capability Tests**:
- 🤖 Tests what the AI agent can do (canvas, todos, tools, code generation)
- 🔌 Uses API calls to validate agent responses and functionality
- 🃊 Measures agent performance and capability coverage
- 📝 Saves detailed logs of agent interactions

**Development Quality Checks** are handled separately:
- 🔧 Lint, TypeScript, and formatting via `./run-v2.sh` menu
- ⚙️ Unit tests for code components via pnpm scripts
- 🛠️ Build system integration tests
- 📝 Code quality and syntax validation

---

## 🚀 Quick Start

1. **Make sure AgenticForge is running:**
   ```bash
   # From root directory
   cd ..
   ./run-v2.sh start
   ```

2. **Run tests from root directory (Recommended):**
   ```bash
   # Interactive test menu
   ./run-tests.sh
   
   # Quick canvas & todo tests
   ./run-tests.sh canvas
   
   # Full capability tests
   ./run-tests.sh full
   ```

3. **Or run from tests directory:**
   ```bash
   cd tests
   
   # Interactive menu
   ./test-runner.sh
   
   # Specific tests
   ./test-canvas-todo.sh
   ./test-agent-capabilities.sh
   ```

## 📋 Test Categories

### Canvas Tests
- **Architecture Diagrams**: Test creating system architecture visuals
- **Workflow Charts**: Test process flow visualization
- **Interactive Updates**: Test modifying existing canvases
- **Multi-Canvas Management**: Test handling multiple canvases

### Todo List Tests
- **List Creation**: Test creating structured todo lists
- **Task Management**: Test adding, completing, updating tasks
- **Priority Handling**: Test priority-based task organization
- **Status Tracking**: Test progress monitoring

### Integration Tests
- **Canvas + Todo**: Test using both systems together
- **Tool Creation**: Test creating custom MCP tools
- **Code Generation**: Test TypeScript/Python code creation
- **Task Execution**: Test complex multi-step workflows

## 📊 Test Results

Test results are saved in:
- `agent-test-logs/` - Detailed API responses and test data
- `test-logs/` - General test execution logs
- Individual JSON files for each test scenario

## 🔍 Sample Test Scenarios

### Canvas Creation Test
```json
{
  "message": "Create a canvas diagram showing AgenticForge architecture with: User Interface, API Server, Worker Process, Redis, PostgreSQL, Docker. Show connections between them.",
  "sessionId": "test-session-123"
}
```

### Todo List Test
```json
{
  "message": "Create a todo list for testing AgenticForge with tasks: 1. Test canvas functionality, 2. Test tool creation, 3. Test code generation, 4. Test web automation",
  "sessionId": "test-session-123"
}
```

### Tool Creation Test
```json
{
  "message": "Create a custom MCP tool called 'systemInfo' that gathers CPU, memory, and disk usage. Write it in TypeScript with Zod schemas.",
  "sessionId": "test-session-123"
}
```

## 🛠️ Customizing Tests

### Adding New Tests
1. Add test function to appropriate script
2. Follow the pattern:
   ```bash
   test_new_feature() {
       echo -e "${COLOR_BLUE}🔧 Testing new feature...${NC}"
       
       local message='{"message": "...", "sessionId": "'$SESSION_ID'"}'
       
       if response=$(api_call "/api/chat" "POST" "$message"); then
           log_test "New feature test" "PASS"
       else
           log_test "New feature test" "FAIL" "Error details"
       fi
   }
   ```

### Custom API Tests
Use the `custom_test()` function in `test-runner.sh` to send any message to the agent and see the response.

## 📈 Expected Results

### Successful Test Run
- ✅ All API calls return 200 status
- ✅ Agent responds with structured data
- ✅ Canvas artifacts created in UI
- ✅ Todo lists visible in interface
- ✅ Tools integrated and executable
- ✅ Code files generated in workspace

### Test Output Example
```
🎨📋 Testing Canvas & Todo List Capabilities
Session: canvas-todo-test-1234567890

🤖 Creating project todo list
Message: Create a todo list for a web development project...
✅ Message sent, waiting for processing...

🤖 Creating architecture canvas diagram  
Message: Create a canvas diagram showing web application architecture...
✅ Message sent, waiting for processing...

🎉 Canvas & Todo List tests completed!
```

## 🔧 Troubleshooting

### Common Issues

1. **AgenticForge not running**
   ```bash
   ./run-v2.sh status
   ./run-v2.sh start
   ```

2. **Authentication errors**
   - Check `.env` file exists
   - Verify `AUTH_TOKEN` is set correctly

3. **API timeouts**
   - Complex requests may take 30+ seconds
   - Check `worker.log` for processing status

4. **Missing dependencies**
   - Install `jq` for JSON formatting: `sudo apt-get install jq`
   - Install `curl` if not available

### Debug Mode
Add `set -x` to any script for verbose debugging output.

## 📱 Web Interface Verification

After running tests, check the AgenticForge web interface at `http://localhost:3002` to see:
- Created canvases in the visual interface
- Todo lists with tasks and completion status
- Generated tools in the tools panel
- Session history with all interactions

---

**Happy Testing! 🧪✨**