# CLI Agent Manager Design

## Overview

The CLI Agent Manager is a sophisticated orchestrator that expertly coordinates multiple external CLI tools (gemini-cli, qwen-code, claude-code) configured as professional-grade sub-agents. This system implements intelligent token economy principles with vigilant supervision, ensuring efficient resource utilization while maintaining continuous oversight of all sub-agents.

As a master orchestrator, the CLI Agent Manager never abandons its sub-agents and actively seeks important work for them, maximizing their potential through professional configuration and management. The system provides unified task delegation, resource management, and real-time streaming capabilities while maintaining the existing tool architecture patterns.

A key requirement is to enable the frontend to display sub-agents in the canvas in real-time, providing users with visibility into the orchestration process. AgenticForge must become an expert at managing sub-agents, with each agent integrating timers or sleep commands into their operations for better control and monitoring. The system leverages tmux for efficient management of multiple CLI processes, providing session persistence and process isolation.

System prompts are adjusted to ensure proper utilization of the new CLI agent management tools, with specific instructions for when to use the specialized delegation mechanisms.

### Repository Type: Backend Application with Full-Stack Integration
AgenticForge is a sophisticated backend application built with Node.js/TypeScript and FastAPI, featuring a React frontend. It implements a microservices architecture with MCP (Model Context Protocol) for dynamic tool creation and management.

## Architecture

### Core Components

```
graph TB
    subgraph "CLI Agent Manager Layer"
        CAM[CLI Agent Manager - Master Orchestrator]
        TR[Task Router - Work Assignment]
        RM[Resource Manager - Token Economy] 
        SM[Stream Manager - Real-time Monitoring]
        TM[Timer Manager - Rate Control]
        TXM[Tmux Manager - Session Control]
    end
    
    subgraph "Professional Sub-Agent Layer"
        GC[gemini-cli - Knowledge Specialist]
        QC[qwen-code - Coding Expert]
        CC[claude-code - Creative Specialist]
    end
    
    subgraph "AgenticForge Core"
        TR_CORE[Tool Registry]
        AGENT[Agent Orchestrator]
        REDIS[Redis Pub/Sub]
        API[Web API]
    end
    
    subgraph "Client Layer"
        UI[React Frontend]
        CANVAS[Canvas Component - Visualization]
        SSE[Server-Sent Events]
    end
    
    CAM --> TR
    CAM --> RM
    CAM --> SM
    CAM --> TM
    CAM --> TXM
    
    TR --> GC
    TR --> QC  
    TR --> CC
    
    CAM --> TR_CORE
    SM --> REDIS
    REDIS --> SSE
    SSE --> UI
    SSE --> CANVAS
    
    AGENT --> CAM
    API --> CAM
    
    style CAM fill:#4CAF50,stroke:#2E7D32
    style TR fill:#2196F3,stroke:#1565C0
    style RM fill:#FF9800,stroke:#E65100
    style SM fill:#9C27B0,stroke:#6A1B9A
    style TM fill:#FF5722,stroke:#E64A19
    style TXM fill:#00BCD4,stroke:#008BA3
```

### Integration with Existing Architecture

The CLI Agent Manager extends the current `delegateTask.tool.ts` pattern but provides enhanced capabilities as a professional orchestrator:

- **Intelligent Task Routing**: Assigns important work to appropriately specialized CLI tools based on task requirements
- **Token Economy Management**: Implements resource tracking and optimization to minimize token consumption
- **Continuous Supervision**: Maintains vigilant oversight of all sub-agents with real-time monitoring
- **Stream Management**: Real-time output streaming with structured event handling
- **Timer Management**: Integration of timers or sleep commands in agent operations for rate control
- **Tmux Session Management**: Efficient management of multiple CLI processes with session persistence
- **Session Integration**: Maintains session context across CLI tool invocations
- **Frontend Canvas Integration**: Real-time display of sub-agent status and activities with professional visualization

```
# CLI Agent Configuration - Professional Orchestration
CLI_AGENT_TIMEOUT_MS=300000
CLI_AGENT_MAX_CONCURRENT=10
CLI_AGENT_RETRY_ATTEMPTS=3
CLI_AGENT_CIRCUIT_BREAKER_THRESHOLD=5
CLI_AGENT_CIRCUIT_BREAKER_TIMEOUT=60000
CLI_AGENT_MIN_SLEEP_MS=1000
CLI_AGENT_DEFAULT_TIMER_MS=5000
CLI_AGENT_USE_TMUX=true
CLI_AGENT_TMUX_SOCKET_PATH=/tmp/agenticforge-tmux-socket
CLI_AGENT_SUPERVISION_LEVEL=continuous
CLI_AGENT_TOKEN_ECONOMY=enabled

# Agent-specific settings - Professional Configuration
GEMINI_CLI_PATH=/usr/local/bin/gemini-cli
QWEN_CODE_PATH=/usr/local/bin/qwen-code  
CLAUDE_CODE_PATH=/usr/local/bin/claude-code

# Resource limits - Token Economy
GEMINI_CLI_CREDITS_LIMIT=1000
QWEN_CODE_CREDITS_LIMIT=1500
CLAUDE_CODE_CREDITS_LIMIT=800

# Timer settings - Rate Control
GEMINI_CLI_MIN_SLEEP_MS=1000
QWEN_CODE_MIN_SLEEP_MS=2000
CLAUDE_CODE_MIN_SLEEP_MS=1500

# Tmux settings - Session Persistence
TMUX_ENABLED=true
TMUX_SESSION_PREFIX=agenticforge-agent
TMUX_PERSIST_SESSIONS=true

# Professional Configuration Settings
PROFESSIONAL_CONFIG_ENABLED=true
CONTINUOUS_SUPERVISION=true
WORK_ASSIGNMENT_STRATEGY=priority-based
TOKEN_OPTIMIZATION_LEVEL=aggressive
```

### Agent Registry Configuration

``typescript
interface AgentConfig {
  name: string
  executable: string
  specializations: string[]
  maxConcurrentTasks: number
  defaultTimeout: number
  retryAttempts: number
  circuitBreakerConfig: CircuitBreakerConfig
  minSleepInterval: number
  enforceTimers: boolean
  useTmuxSessions: boolean
  sessionPersistence: boolean
  professionalConfiguration: ProfessionalConfig
}

interface ProfessionalConfig {
  specializationDepth: 'basic' | 'intermediate' | 'expert'
  resourceAllocation: 'conservative' | 'balanced' | 'high'
  errorRecovery: 'basic' | 'robust' | 'comprehensive' | 'adaptive'
  monitoringLevel: 'periodic' | 'continuous' | 'intensive'
}

const agentConfigs: AgentConfig[] = [
  {
    name: 'gemini-cli',
    executable: process.env.GEMINI_CLI_PATH || 'gemini-cli',
    specializations: ['general', 'analysis', 'content'],
    maxConcurrentTasks: 5,
    defaultTimeout: 120000,
    retryAttempts: 2,
    circuitBreakerConfig: { threshold: 5, timeout: 60000 },
    minSleepInterval: parseInt(process.env.GEMINI_CLI_MIN_SLEEP_MS || '1000'),
    enforceTimers: true,
    useTmuxSessions: process.env.CLI_AGENT_USE_TMUX === 'true',
    sessionPersistence: process.env.TMUX_PERSIST_SESSIONS === 'true',
    professionalConfiguration: {
      specializationDepth: 'expert',
      resourceAllocation: 'balanced',
      errorRecovery: 'robust',
      monitoringLevel: 'continuous'
    }
  },
  // ... other agents with professional configurations
]
```

### MCP Tool Creation for CLI Agents

Leverage existing MCP tool creation system to generate specialized tools for each CLI agent with built-in timer enforcement and tmux session management. System prompts are adjusted to ensure proper utilization of these tools:

```
When managing CLI agents, always use the delegateTaskEnhanced tool for complex tasks that require multiple CLI tools. 
For tasks requiring process isolation, use tmux-enabled agents.
For time-sensitive operations, ensure timer enforcement is activated.
Maintain professional configuration of all sub-agents with appropriate specializations.
```

```typescript
// Auto-generated tools for each CLI agent with professional configuration
const geminiCliTool = await createAgentTool({
  agentName: 'gemini-cli',
  specializations: ['general-tasks', 'content-generation', 'analysis'],
  defaultTimeout: 120000,
  enforceTimers: true,
  minSleepInterval: 1000,
  useTmuxSessions: true,
  sessionPersistence: true,
  professionalConfiguration: {
    specializationDepth: 'expert',
    resourceAllocation: 'balanced',
    errorRecovery: 'robust',
    monitoringLevel: 'continuous'
  }
})

const qwenCodeTool = await createAgentTool({
  agentName: 'qwen-code', 
  specializations: ['code-generation', 'debugging', 'refactoring'],
  defaultTimeout: 180000,
  enforceTimers: true,
  minSleepInterval: 2000,
  useTmuxSessions: true,
  sessionPersistence: true,
  professionalConfiguration: {
    specializationDepth: 'expert',
    resourceAllocation: 'high',
    errorRecovery: 'comprehensive',
    monitoringLevel: 'continuous'
  }
})

const claudeCodeTool = await createAgentTool({
  agentName: 'claude-code',
  specializations: ['creative-writing', 'analysis', 'research'],
  defaultTimeout: 150000,
  enforceTimers: true,
  minSleepInterval: 1500,
  useTmuxSessions: true,
  sessionPersistence: true,
  professionalConfiguration: {
    specializationDepth: 'expert',
    resourceAllocation: 'balanced',
    errorRecovery: 'adaptive',
    monitoringLevel: 'continuous'
  }
})
```

### Professional Sub-Agent Configuration

Each CLI sub-agent is configured as a professional specialist with appropriate capabilities:

**gemini-cli - Knowledge Specialist**
- Specialization: General knowledge, content generation, analysis
- Configuration: Balanced resource allocation with robust error recovery
- Monitoring: Continuous oversight with real-time feedback

**qwen-code - Coding Expert**
- Specialization: Code generation, debugging, refactoring
- Configuration: High resource allocation with comprehensive error recovery
- Monitoring: Continuous oversight with detailed execution tracking

**claude-code - Creative Specialist**
- Specialization: Creative writing, analysis, research
- Configuration: Balanced resource allocation with adaptive error recovery
- Monitoring: Continuous oversight with quality assessment

The orchestrator ensures each sub-agent maintains its professional configuration while continuously seeking important work that matches their specializations.

## API Endpoints Reference

### Task Management API

**POST /api/cli-agents/tasks**
```
{
  "taskDescription": "Generate a React component for user authentication",
  "preferredAgent": "qwen-code",
  "priority": "high",
  "timeout": 300000,
  "sessionId": "session-123",
  "context": {
    "framework": "react",
    "typescript": true
  }
}
```

**Response:**
```
{
  "taskId": "task-uuid-123",
  "assignedAgent": "qwen-code",
  "status": "queued",
  "streamUrl": "/api/cli-agents/tasks/task-uuid-123/stream"
}
```

**GET /api/cli-agents/status**
```
{
  "agents": [
    {
      "name": "gemini-cli",
      "status": "available",
      "credits": 85,
      "currentTasks": 2,
      "averageResponseTime": 1200,
      "timers": []
    },
    {
      "name": "qwen-code", 
      "status": "busy",
      "credits": 92,
      "currentTasks": 5,
      "averageResponseTime": 800,
      "timers": [
        {
          "id": "timer-123",
          "duration": 5000,
          "remaining": 2500,
          "type": "delay"
        }
      ]
    },
    {
      "name": "claude-code",
      "status": "maintenance",
      "credits": 0,
      "currentTasks": 0,
      "averageResponseTime": null,
      "timers": []
    }
  ]
}
```

**POST /api/cli-agents/timers**
```
{
  "agent": "gemini-cli",
  "timer": {
    "duration": 3000,
    "command": "sleep 3",
    "type": "delay",
    "taskId": "task-uuid-123"
  }
}
```

**Response:**
```
{
  "timerId": "timer-456",
  "status": "scheduled",
  "agent": "gemini-cli"
}
```

**GET /api/cli-agents/sessions**
```
{
  "sessions": [
    {
      "sessionId": "session-789",
      "agent": "gemini-cli",
      "taskId": "task-uuid-123",
      "status": "active",
      "createdAt": 1700000000000,
      "windowCount": 2
    },
    {
      "sessionId": "session-790",
      "agent": "qwen-code",
      "taskId": "task-uuid-456",
      "status": "active",
      "createdAt": 1700000100000,
      "windowCount": 1
    }
  ]
}
```

**POST /api/cli-agents/sessions/{sessionId}/terminate**
```
{
  "force": false
}
```

**Response:**
```
{
  "sessionId": "session-789",
  "status": "terminated",
  "agent": "gemini-cli"
}
```

### Authentication Requirements

- Uses existing AgenticForge AUTH_TOKEN system
- Same Bearer token authentication as other API endpoints
- Session-based context preservation

## Business Logic Layer

### Task Execution Workflow

```
sequenceDiagram
    participant Client
    participant CAM as CLI Agent Manager (Vigilant Orchestrator)
    participant TR as Task Router
    participant RM as Resource Manager (Token Economy)
    participant TM as Timer Manager
    participant TXM as Tmux Manager
    participant CLI as Professional Sub-Agents
    participant SM as Stream Manager
    participant CANVAS as Canvas Display
    participant Redis
    
    Client->>CAM: Submit Task Request
    CAM->>TR: Route Task (Based on Specialization)
    TR->>RM: Check Resources (Token Economy)
    RM-->>TR: Resource Status
    TR->>CAM: Selected Agent
    CAM->>RM: Reserve Credits (Token Management)
    CAM->>TXM: Create Tmux Session (Persistent Oversight)
    CAM->>TM: Schedule Required Timers (Rate Control)
    CAM->>SM: Create Stream Channel (Continuous Monitoring)
    CAM->>CANVAS: Update Agent Status (Real-time Visualization)
    CAM->>CLI: Execute Task in Tmux Session (Professional Execution)
    
    loop Continuous Supervision
        CLI->>SM: Stream Output (Real-time Feedback)
        SM->>Redis: Publish Event
        Redis->>Client: Real-time Updates
        Redis->>CANVAS: Update Canvas Display
        CLI->>TM: Request Timers/Sleep (Resource Conservation)
        TM->>CLI: Enforce Timing (Rate Control)
        TXM->>CLI: Manage Session (Persistent Oversight)
        CAM->>RM: Monitor Resource Usage (Token Economy)
    end
    
    CLI->>CAM: Task Complete
    CAM->>RM: Release Credits (Resource Management)
    CAM->>TM: Cancel Timers
    CAM->>TXM: Clean Up Session (Orderly Termination)
    CAM->>SM: Close Stream
    CAM->>CANVAS: Update Agent Status (Completion Notification)
    CAM-->>Client: Final Result
    CAM->>TR: Seek Next Important Task (Continuous Engagement)
```

### Agent Selection Algorithm

1. **Task Classification**: Analyze task description using keyword matching and NLP
2. **Agent Scoring**: Score each agent based on:
   - Specialization match (35%)
   - Resource availability (20%) 
   - Current load (15%)
   - Historical performance (10%)
   - Timer compatibility (10%)
   - Session management capability (10%)
3. **Fallback Chain**: Define fallback order for each task type
4. **Circuit Breaker**: Skip agents with recent failures
5. **Timer Requirement Analysis**: Determine if task requires specific timing controls
6. **Tmux Session Requirements**: Evaluate tmux session needs for process isolation and persistence

### Prompt Engineering for Agent Selection

System prompts are engineered to guide the LLM in proper tool selection:

```
When delegating tasks to CLI agents, consider the following:
1. Code generation tasks → qwen-code
2. General knowledge tasks → gemini-cli
3. Creative writing tasks → claude-code
4. Long-running processes → Use tmux-enabled sessions
5. Time-sensitive tasks → Ensure timer enforcement

Always prefer the delegateTaskEnhanced tool over direct CLI execution.

As a master orchestrator, never abandon your sub-agents. Continuously seek important work for them and ensure they are always productively engaged. Monitor their performance vigilantly and optimize resource allocation for maximum efficiency.

Implement token economy principles:
- Minimize redundant operations
- Use appropriate agent specializations
- Apply timers for rate limiting
- Monitor resource consumption continuously
```

### Error Handling Strategy

``typescript
interface ErrorHandler {
  handleAgentFailure(agent: string, error: Error): Promise<RecoveryAction>
  handleResourceExhaustion(agent: string): Promise<AlternativeAgent[]>
  handleStreamDisruption(taskId: string): Promise<ReconnectionStrategy>
}

enum RecoveryAction {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  FAIL = 'fail',
  QUEUE = 'queue'
}

// As a responsible orchestrator, always attempt recovery before considering failure
const orchestratorPhilosophy = {
  persistence: "Never abandon sub-agents",
  recoveryFocus: "Prioritize recovery over failure",
  resourceConservation: "Implement token economy in error handling",
  continuousEngagement: "Find alternative work when primary tasks fail"
};
```


## Testing Strategy

### Unit Testing

**Component Tests:**
- Task Router logic and agent selection algorithms
- Resource Manager credit tracking and rate limiting
- Stream Manager event handling and channel management
- Orchestrator supervision continuity
- Token economy implementation

**Mock CLI Tools:**
```typescript
describe('CLI Agent Manager', () => {
  const mockCLI = createMockCLI({
    agent: 'gemini-cli',
    responses: ['Mock response 1', 'Mock response 2'],
    delay: 1000
  })
  
  it('should route tasks based on specialization', async () => {
    const task = { taskDescription: 'Generate Python code', agent: 'auto' }
    const result = await cliManager.delegateTask(task)
    expect(result.assignedAgent).toBe('qwen-code')
  })
  
  it('should maintain continuous supervision of sub-agents', async () => {
    const task = { taskDescription: 'Long-running task', agent: 'qwen-code' }
    const result = await cliManager.delegateTask(task)
    // Verify that supervision mechanisms are active
    expect(cliManager.getSupervisionStatus('qwen-code')).toBe('active')
  })
  
  it('should implement token economy principles', async () => {
    const initialCredits = await resourceManager.getCredits('gemini-cli')
    const task = { taskDescription: 'Simple query', agent: 'gemini-cli' }
    await cliManager.delegateTask(task)
    const finalCredits = await resourceManager.getCredits('gemini-cli')
    // Verify that token consumption is optimized
    expect(finalCredits).toBeLessThan(initialCredits)
    expect(cliManager.getTokenEfficiency()).toBeGreaterThan(0.8)
  })
})
```

### Integration Testing

**CLI Tool Integration:**
- Test actual CLI tool execution with safe commands
- Validate streaming output and event publishing
- Verify error handling and recovery mechanisms
- Test continuous supervision functionality
- Validate token economy implementation

**Tmux Session Management:**
- Test tmux session creation, attachment, and detachment
- Validate process isolation between different agent sessions
- Verify session persistence and cleanup procedures
- Test window and pane management within agent sessions
- Validate continuous session monitoring

**Resource Management:**
- Test credit deduction and restoration
- Validate rate limiting enforcement
- Test circuit breaker activation and recovery
- Verify token economy optimization
- Test resource allocation efficiency

### Performance Testing

**Load Testing:**
- Concurrent task execution across multiple CLI agents
- Stream handling under high message volume
- Resource contention and queuing behavior
- Continuous supervision under load
- Token economy effectiveness under stress

**Metrics:**
- Task completion time per agent
- Stream latency and throughput
- Error rates and recovery times
- Token consumption efficiency
- Supervision continuity percentage
