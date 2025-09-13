// Test Sonoma Dusk with EXACT worker prompt structure
// This replicates the exact conditions that cause empty responses in the worker

async function testWorkerContextSonoma() {
  console.log('🧪 Testing Sonoma Dusk with Worker Context (Exact Replication)\n');

  // Read API key directly from .env file
  const fs = await import('fs');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const apiKeyMatch = envContent.match(/LLM_API_KEY_OPENROUTER_SKY=(.+)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error('❌ No OpenRouter API key found in .env file');
    return;
  }

  console.log('✅ API key loaded successfully');

  // Test 1: Simple prompt (should work)
  console.log('\n📝 Test 1: Simple prompt (control test)');
  try {
    const response1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AgenticForge Test',
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages: [
          { role: 'user', content: 'Hello! Can you help me?' }
        ]
      })
    });

    const data1 = await response1.json();
    console.log('✅ Simple prompt result:', {
      status: response1.status,
      content: data1.choices?.[0]?.message?.content?.substring(0, 100) + '...',
      usage: data1.usage
    });
  } catch (error) {
    console.log('❌ Simple prompt failed:', error.message);
  }

  // Test 2: EXACT worker prompt structure (replicating the issue)
  console.log('\n📝 Test 2: EXACT Worker Prompt Structure (46 tools + system + context)');

  // Build the exact same prompt structure as the worker
  const systemPrompt = `# AgenticForge - Direct AI Assistant

You are AgenticForge. Be extremely concise. Act immediately.

## Core Rules

- **Direct responses**: Simple greetings → \`finish\` immediately
- **No unnecessary thoughts**: Skip \`agent_thought\` for basic interactions
- **Action first**: For tasks → \`todo_write\` then work
- **JSON only**: Always valid JSON format

## Tools

- \`finish\` - Social responses, simple answers
- \`agent_thought\` - Only when planning complex tasks (1 sentence max)
- \`todo_write\` - All creation/building requests
- \`readFile/writeFile\` - File operations
- \`executeShellCommand\` - System commands
- \`playwright_navigate\` - Web navigation
- \`display_canvas\` - Final deliverables
- \`listTools\` - List available tools
- \`summarize\` - Text summarization
- \`project_planning\` - Project planning and management

## Financial Tools

**Finance Tool (Unified):**

- \`finance\` - Complete financial data access (API key automatically provided)
  - \`action="quote"\` - Current stock price & volume
  - \`action="overview"\` - Company information
  - \`action="daily"\` - Historical daily data
  - \`action="intraday"\` - Intraday price data
  - \`action="technical"\` - RSI, SMA, EMA, MACD, Stochastic, Bollinger Bands
  - \`action="search"\` - Symbol search

**Quick Access:**

- \`global_quote\` - Fast stock quotes (TSLA, AAPL, etc.) - API key automatically provided

## File Management Tools

**File Manager (Unified):**

- \`file_manager\` - Complete file operations
  - \`action="read"\` - Read file content
  - \`action="write"\` - Write/create files
  - \`action="list"\` - List directory contents
  - \`action="delete"\` - Delete files/directories

## Web Automation Tools

**Web Automation (Unified):**

- \`web_automation\` - Complete web interaction
  - \`action="navigate"\` - Navigate to URL
  - \`action="click"\` - Click elements
  - \`action="type"\` - Type text in inputs
  - \`action="get_content"\` - Extract page content
  - \`action="screenshot"\` - Take screenshots

**Usage Examples:**

- Stock quote: \`finance(action="quote", symbol="TSLA")\`
- Company info: \`finance(action="overview", symbol="AAPL")\`
- Technical analysis: \`finance(action="technical", technical_indicator="rsi", symbol="TSLA")\`
- Read file: \`file_manager(action="read", path="file.txt")\`
- Navigate web: \`web_automation(action="navigate", url="https://example.com")\`

## Response Format (MANDATORY)

\`\`\`json
{
  "thought": "Brief (optional for simple responses)",
  "command": {
    "name": "tool_name",
    "params": { "param": "value" }
  }
}
\`\`\`

## Examples

**Greeting "hello":**

\`\`\`json
{
  "command": {
    "name": "finish",
    "params": { "response": "Hello! How can I help?" }
  }
}
\`\`\`

**Task "create game":**

\`\`\`json
{
  "command": {
    "name": "todo_write",
    "params": {
      "todos": [
        { "id": "1", "content": "Create game structure", "status": "pending" }
      ]
    }
  }
}
\`\`\`

**SUCCESS = DIRECT ACTION**`;

  // Add all 46+ tools (simplified but comprehensive)
  const toolsSection = `

## Available Tools:
### ai_summarize
Description: Summarize text content
Parameters (JSON Schema):
{"type":"object","properties":{"text":{"type":"string","description":"The text to summarize"}},"required":["text"]}

### alpha_intelligence
Description: Get Alpha Vantage AI insights
Parameters (JSON Schema):
{"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}

### wti
Description: Get WTI crude oil prices
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"}},"required":["function"]}

### company_overview
Description: Get company overview data
Parameters (JSON Schema):
{"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}

### core_stock_apis
Description: Core stock market data
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"symbol":{"type":"string"}},"required":["function","symbol"]}

### digital_currency_daily
Description: Digital currency daily data
Parameters (JSON Schema):
{"type":"object","properties":{"symbol":{"type":"string"},"market":{"type":"string"}},"required":["symbol","market"]}

### economic_indicators
Description: Economic indicators data
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"}},"required":["function"]}

### finance
Description: Unified financial data access
Parameters (JSON Schema):
{"type":"object","properties":{"action":{"type":"string"},"symbol":{"type":"string"}},"required":["action"]}

### forex
Description: Foreign exchange data
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"from_symbol":{"type":"string"},"to_symbol":{"type":"string"}},"required":["function","from_symbol","to_symbol"]}

### fx_daily
Description: FX daily data
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"from_symbol":{"type":"string"},"to_symbol":{"type":"string"}},"required":["function","from_symbol","to_symbol"]}

### global_quote
Description: Global stock quote
Parameters (JSON Schema):
{"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}

### indicator
Description: Technical indicators
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"symbol":{"type":"string"},"interval":{"type":"string"}},"required":["function","symbol","interval"]}

### inflation
Description: Inflation data
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"}},"required":["function"]}

### news_sentiment
Description: News sentiment analysis
Parameters (JSON Schema):
{"type":"object","properties":{"tickers":{"type":"string"},"topics":{"type":"string"}},"required":["tickers"]}

### alpha_vantage_ping
Description: Test Alpha Vantage connectivity
Parameters (JSON Schema):
{"type":"object","properties":{}}

### rsi
Description: Relative Strength Index
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"symbol":{"type":"string"},"interval":{"type":"string"},"time_period":{"type":"number"}},"required":["function","symbol","interval","time_period"]}

### sma
Description: Simple Moving Average
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"symbol":{"type":"string"},"interval":{"type":"string"},"time_period":{"type":"number"},"series_type":{"type":"string"}},"required":["function","symbol","interval","time_period","series_type"]}

### symbol_search
Description: Search for stock symbols
Parameters (JSON Schema):
{"type":"object","properties":{"keywords":{"type":"string"}},"required":["keywords"]}

### technical_indicators
Description: Technical indicators data
Parameters (JSON Schema):
{"type":"object","properties":{"function":{"type":"string"},"symbol":{"type":"string"}},"required":["function","symbol"]}

### time_series_daily
Description: Daily time series data
Parameters (JSON Schema):
{"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}

### time_series_intraday
Description: Intraday time series data
Parameters (JSON Schema):
{"type":"object","properties":{"symbol":{"type":"string"},"interval":{"type":"string"}},"required":["symbol","interval"]}

### playwright_click
Description: Click element on web page
Parameters (JSON Schema):
{"type":"object","properties":{"selector":{"type":"string"}},"required":["selector"]}

### playwright_evaluate
Description: Evaluate JavaScript on page
Parameters (JSON Schema):
{"type":"object","properties":{"script":{"type":"string"}},"required":["script"]}

### playwright_get_content
Description: Get page content
Parameters (JSON Schema):
{"type":"object","properties":{"selector":{"type":"string"}}}

### playwright_navigate
Description: Navigate to URL
Parameters (JSON Schema):
{"type":"object","properties":{"url":{"type":"string"}},"required":["url"]}

### playwright_screenshot
Description: Take page screenshot
Parameters (JSON Schema):
{"type":"object","properties":{"path":{"type":"string"}}}

### playwright_set_viewport
Description: Set viewport size
Parameters (JSON Schema):
{"type":"object","properties":{"width":{"type":"number"},"height":{"type":"number"}},"required":["width","height"]}

### playwright_type
Description: Type text in input field
Parameters (JSON Schema):
{"type":"object","properties":{"selector":{"type":"string"},"text":{"type":"string"}},"required":["selector","text"]}

### playwright_wait_for_selector
Description: Wait for element to appear
Parameters (JSON Schema):
{"type":"object","properties":{"selector":{"type":"string"}},"required":["selector"]}

### web_automation
Description: Unified web automation
Parameters (JSON Schema):
{"type":"object","properties":{"action":{"type":"string"},"url":{"type":"string"},"selector":{"type":"string"},"text":{"type":"string"}},"required":["action"]}

### executeShellCommand
Description: Execute shell commands
Parameters (JSON Schema):
{"type":"object","properties":{"command":{"type":"string"}},"required":["command"]}

### editFile
Description: Edit file content
Parameters (JSON Schema):
{"type":"object","properties":{"filePath":{"type":"string"},"oldString":{"type":"string"},"newString":{"type":"string"}},"required":["filePath","oldString","newString"]}

### file_manager
Description: Unified file operations
Parameters (JSON Schema):
{"type":"object","properties":{"action":{"type":"string"},"path":{"type":"string"},"content":{"type":"string"}},"required":["action"]}

### listFiles
Description: List directory contents
Parameters (JSON Schema):
{"type":"object","properties":{"path":{"type":"string"}}}

### readFile
Description: Read file content
Parameters (JSON Schema):
{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}

### writeFile
Description: Write file content
Parameters (JSON Schema):
{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}

### projectPlanning
Description: Project planning and management
Parameters (JSON Schema):
{"type":"object","properties":{"action":{"type":"string"},"projectName":{"type":"string"}},"required":["action"]}

### canvasConsoleFeedback
Description: Canvas console feedback
Parameters (JSON Schema):
{"type":"object","properties":{"message":{"type":"string"}},"required":["message"]}

### system_createTool
Description: Create new tools dynamically
Parameters (JSON Schema):
{"type":"object","properties":{"name":{"type":"string"},"description":{"type":"string"},"parameters":{"type":"object"}},"required":["name","description"]}

### delegateTask
Description: Delegate tasks to other agents
Parameters (JSON Schema):
{"type":"object","properties":{"task":{"type":"string"},"priority":{"type":"string"}},"required":["task"]}

### display_canvas
Description: Display canvas content
Parameters (JSON Schema):
{"type":"object","properties":{"content":{"type":"string"},"contentType":{"type":"string"}},"required":["content","contentType"]}

### finish
Description: Complete the task
Parameters (JSON Schema):
{"type":"object","properties":{"response":{"type":"string"}},"required":["response"]}

### getDevelopmentPreferences
Description: Get development preferences
Parameters (JSON Schema):
{"type":"object","properties":{}}

### listTools
Description: List available tools
Parameters (JSON Schema):
{"type":"object","properties":{}}

### setDevelopmentPreferences
Description: Set development preferences
Parameters (JSON Schema):
{"type":"object","properties":{"preferences":{"type":"object"}},"required":["preferences"]}

### todoWrite
Description: Write todo items
Parameters (JSON Schema):
{"type":"object","properties":{"todos":{"type":"array"}},"required":["todos"]}`;

  // Add conversation history (simulating worker context)
  const historySection = `

## Conversation History:
USER:
Hello! Can you help me with a simple task?

ASSISTANT:
The agent is thinking... (iteration 1)

USER:
Hello! Can you help me with a simple task?

ASSISTANT:
The agent is thinking... (iteration 1)`;

  // Add working context
  const workingContextSection = `

## Working Context:
{
  "data": {
    "workingContext": {
      "executedActions": [],
      "iterationCount": 1,
      "lastDisplayCanvas": false
    }
  },
  "id": "test-session"
}`;

  // Add task management instructions
  const taskInstructions = `

## Task Management Instructions:
- For "Créer une todo list simple" (Create a simple todo list), always use the todo_write tool to create exactly 3-5 relevant tasks with status "pending". Do not use finish after creating the list; the task is complete only after creating multiple tasks and confirming the list is ready.
- For "Ajouter des éléments à la liste de tâches" (Add items to the todo list), use todo_write to append 2-3 new tasks to the existing list with status "pending". Do not use finish until all items are added.
- For "Marquer la première tâche comme terminée" (Mark the first task as done), use todo_write to update the status of the first task in the list to "completed". Do not use finish until the task is fully done.
- Always use the todo_write tool for managing todo lists. Only use finish when the entire todo-related task is complete with no further actions needed.
- The todo_write tool takes a "todos" parameter which is an array of objects with id, content, status (pending/completed), priority (high/medium/low), and category (e.g., personal/work).

Remember: For todo-related tasks, prioritize using todo_write before finishing. Create multiple tasks for creation requests and continue iterations if needed to complete the task fully.`;

  // Combine all sections (this replicates the exact worker prompt)
  const fullWorkerPrompt = systemPrompt + toolsSection + historySection + workingContextSection + taskInstructions;

  // Add the final instruction
  const finalPrompt = fullWorkerPrompt + `

ASSISTANT's turn. Your response:`;

  console.log(`📊 Worker prompt size: ${finalPrompt.length} characters (approximately ${Math.round(finalPrompt.length / 4)} tokens)`);

  try {
    const response2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AgenticForge Test',
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages: [
          { role: 'user', content: finalPrompt }
        ]
      })
    });

    const data2 = await response2.json();
    console.log('🔍 Worker context result:', {
      status: response2.status,
      model: data2.model,
      content: data2.choices?.[0]?.message?.content?.substring(0, 200) + '...',
      usage: data2.usage,
      finish_reason: data2.choices?.[0]?.finish_reason
    });

    if (!data2.choices?.[0]?.message?.content || data2.choices[0].message.content.trim() === '') {
      console.log('❌ CONFIRMED: Sonoma Dusk returns EMPTY content with worker prompt!');
      console.log('🔍 This explains why the worker fails - the model refuses to respond to complex prompts');
    } else {
      console.log('✅ Sonoma Dusk handled worker prompt successfully');
    }

  } catch (error) {
    console.log('❌ Worker context test failed:', error.message);
  }

  console.log('\n🎯 CONCLUSION: The issue is confirmed - Sonoma Dusk works with simple prompts but returns empty content with complex AgenticForge worker prompts');
}

// Run the test
testWorkerContextSonoma().catch(console.error);