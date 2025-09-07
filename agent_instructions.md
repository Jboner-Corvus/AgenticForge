# Complete Guide for Beginner Agents - AgenticForge Test Execution

## 🎯 Objective

Execute AgenticForge system test tasks one by one following the required practices. This guide will help you understand how to properly test the system step by step.

## 📋 Prerequisites - Before You Start

### 1. Start the System

First, you need to start the AgenticForge system:

```bash
./run.sh start
```

### 2. Verify Services Are Running

Check that services are accessible on:

- Main API: http://localhost:3002
- Other services as defined in the system

### 3. Authentication Token

You'll need this authentication token for all API requests:

```
Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0
```

## 🔄 Task Execution Process - Step by Step

### Step 1: Identify Tasks to Execute

Look at the taches.md file to find tasks to execute. Tasks are organized by categories:

- **File Operations**: Creating, reading, modifying, deleting files
- **Todo Lists**: Managing task lists
- **Canvas Display**: Showing content in the canvas
- **AI Tools**: Using web_search, agent_response, etc.
- **Session Management**: Handling user sessions
- **Shell Commands**: Executing system commands
- **Communication**: Handling thoughts and responses
- **Complex Tests**: Integration and complex scenarios
- **Browser Tests**: Playwright browser automation

### Step 2: Select the Right System Prompt

Each task type requires a specific system prompt. Use this guide:

| Task Type                       | System Prompt  | When to Use                                                |
| ------------------------------- | -------------- | ---------------------------------------------------------- |
| File Operations                 | `code`         | When creating, reading, modifying, or deleting files       |
| Todo Lists                      | `orchestrator` | When managing task lists                                   |
| Canvas Display                  | `architect`    | When showing content in the canvas (HTML, games, websites) |
| AI Tools & Research             | `ask`          | When using web_search or other AI tools                    |
| Session Management              | `orchestrator` | When creating or managing sessions                         |
| Shell Commands                  | `code`         | When executing system commands                             |
| Communication & Thoughts        | `ask`          | When responding directly to user or thinking               |
| Complex Tests & Integration     | `orchestrator` | For complex multi-step tasks                               |
| Security & Performance          | `debug`        | When testing security or debugging                         |
| Trading/Financial Tests         | `trader`       | For financial data and trading tasks                       |
| Browser Automation (Playwright) | `ask`          | For browser automation tasks                               |

### Step 3: Build the API Request

For each task, construct a curl request using this format:

```bash
curl -X POST http://localhost:3002/api/test-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0" \
  -d '{
    "prompt": "[Exact description of the task to execute]",
    "sessionName": "[Descriptive session name]",
    "systemPrompt": "[appropriate_system_prompt]"
  }'
```

### Step 4: Execute and Verify

For each task:

1. **Execute** the API request
2. **Check logs** with: `tail -n 200 worker.log`
3. **Analyze results** to ensure the task executed correctly
4. **Fix source code** if needed

## 📚 Practical Examples - Learn by Doing

### Example 1: File Task

For a task like "Read and analyze a complex JSON file":

- System prompt: `code`
- Request:

```bash
curl -X POST http://localhost:3002/api/test-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0" \
  -d '{
    "prompt": "Read and analyze a complex JSON file",
    "sessionName": "Test reading complex JSON file",
    "systemPrompt": "code"
  }'
```

### Example 2: Canvas Task

For a task like "Create a complex flow diagram with multiple levels":

- System prompt: `architect`
- Request:

```bash
curl -X POST http://localhost:3002/api/test-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0" \
  -d '{
    "prompt": "Create a complex flow diagram with multiple levels",
    "sessionName": "Test flow diagram",
    "systemPrompt": "architect"
  }'
```

### Example 3: Playwright Task

For a task like "playwright_set_viewport to 1280x720":

- System prompt: `ask`
- Request:

```bash
curl -X POST http://localhost:3002/api/test-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0" \
  -d '{
    "prompt": "playwright_set_viewport to 1280x720",
    "sessionName": "Test Playwright viewport",
    "systemPrompt": "ask"
  }'
```

## 🎮 Special One-Shot Tasks - Important!

Some tasks are "one-shot" tasks that require special attention:

1. **Diver on shot - mode code**
   - System prompt: `code`
   - This is a coding task, not a canvas display task

2. **One shot Defender ultra graphic game - display in canvas**
   - System prompt: `architect`
   - This is a canvas display task for a game

3. **One shot Duke Nukem 2 - display in canvas**
   - System prompt: `architect`
   - This is a canvas display task for a game

4. **One shot big website about himself - display in canvas**
   - System prompt: `architect`
   - This is a canvas display task for a website

## ✅ Best Practices - Follow These Rules

1. **Always Validate**: Check logs after every execution
2. **Fix Before Moving On**: If a task fails, fix the code before proceeding
3. **Document Everything**: Record any difficulties or corrections made
4. **Logical Grouping**: You can group related tasks for efficiency
5. **One Task at a Time**: Complete one task fully before starting the next

## 🔍 Final Verification

After executing tasks:

1. Check final logs to confirm no errors are present
2. Document any difficulties encountered or corrections made

## 🆘 Troubleshooting Common Issues

### If the API returns an error:

1. Check that the system is running (`./run.sh start`)
2. Verify the authentication token is correct
3. Ensure the system prompt matches the task type
4. Check the worker.log file for detailed error messages

### If a task doesn't work as expected:

1. Look at the logs with `tail -n 200 worker.log`
2. Identify what went wrong
3. Modify the source code if needed
4. Try the task again

### If you're unsure which system prompt to use:

1. Look at the task description
2. Match it to the categories in the System Prompt table
3. When in doubt, use `ask` for general tasks or `code` for file operations

## 📝 Tips for Success

1. **Read the task carefully** - Make sure you understand what's being asked
2. **Choose the right system prompt** - This is crucial for success
3. **Use descriptive session names** - This helps with debugging
4. **Check logs frequently** - This helps catch issues early
5. **Don't skip failed tasks** - Fix them before moving on
6. **Ask for help if stuck** - But try to solve problems yourself first
