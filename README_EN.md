<p align="center">
  <img src="assets/title.png" alt="AgenticForge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
<p align="center">
  <strong>🌐 Available Languages</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      Your new 100% autonomous, free and local AI agent
</h3>

<p align="center">
  <em>
    Your new 100% autonomous, free and local AI agent, ensuring total privacy. Designed entirely with the MCP protocol, it executes complex tasks, writes code and forges its own tools, which are directly displayed in the user interface for total transparency. Thanks to its intelligent API key router that follows a configurable hierarchy, it automatically switches to never run out of requests. Ready to explore the future of private AI?
  </em>
</p>
<br>
<p align="center">
    <a href="https://discord.gg/VNtXQByKfg"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/MCP-000000?style=for-the-badge&logoColor=white" alt="MCP">
    <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
</p>

## Why AgenticForge?

🔒 **Fully Local and Private** - Everything runs on your machine — no cloud, no data sharing. Your files, conversations and tools remain private.

🛠️ **Self-Tool Forging MCP** - AgenticForge directly codes custom MCP tools in TypeScript with Zod schemas, integrates them to the worker in real time and displays them in the interface with total transparency.

💰 **Prolonged Free Operation** - Thanks to a key management trick, especially with Qwen, AgenticForge can run continuously for several days without cost.

🤖 **Sub-Agent Control** - Capable of orchestrating and controlling other command-line interface (CLI) agents to delegate and parallelize complex tasks.

💻 **Autonomous Coding Assistant** - Need code? It can write, debug and execute programs in Python, TypeScript, Bash and more — without supervision.

🧠 **Intelligent Tool Selection** - You ask, it automatically finds the best tool for the job. Like having a forge of experts ready to help.

📋 **Plans and Executes Complex Tasks** - From file management to web scraping — it can divide large tasks into steps and forge the tools to accomplish the work.

🌐 **Smart Web Navigation** - AgenticForge can browse the internet autonomously — search, read, extract info, automate tasks — all without intervention.

🔄 **Intelligent LlmKeyManager** - Advanced API key management system with automatic failover, performance monitoring and temporary disabling of faulty keys.

🚀 **Native MCP Forge** - Uses the MCP protocol with FastMCP to create, modify and deploy custom tools in real time. Each tool is coded, tested and automatically integrated to the worker. The tools created with MCP are directly accessible for an n8n agent.

---

## 🛠️ ⚠️ Active Work in Progress

🙏 This project started to prove that MCP was better than API and has grown beyond expectations. Contributions, feedback and patience are deeply appreciated as we forge ahead.

---

## 📋 Prerequisites

**Required for installation:**

- **Docker Engine & Docker Compose**: For main services
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended): Windows | Mac | Linux
  - Or [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**: For build and local worker
  - [Download Node.js](https://nodejs.org/)
- **pnpm**: Package manager
  ```bash
  npm install -g pnpm
  ```
- **Git**: To clone the project

### 🖥️ System Compatibility

> **AgenticForge** is designed to be deployed on **Linux** or **macOS**.  
> **Windows is not officially supported**.

---

## 🚀 Production Installation

### 🤖 Ultra-Simple Installation (100% Automatic)

**Option 1: One-line installation**
```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**Option 2: Classic installation**
```bash
# 1. Clone the project
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Fully automated installation
chmod +x run-v2.sh
./run-v2.sh install
```

**Option 3: Interactive installation**
```bash
# 1. Clone the project
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Launch the AgenticForge management console
chmod +x run-v2.sh
./run-v2.sh
```

**Production Management Console:**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & Services
    1) 🟢 Start Services            5) 📊 Worker Logs
    2) 🔄 Restart All               6) 🐚 Container Shell
    3) 🔴 Stop Services              7) 🔨 Rebuild All
    4) ⚡ Status                    8) 🐳 Docker Logs

    Testing & Quality
    9) 🔬 Unit Tests Only           12) 🔍 Lint Code
   10) 🔗 Integration Tests         13) ✨ Format Code
   11) 🧪 All Tests                14) 📘 Type Check

   15) 🚪 Exit
```

**Choose "1) 🟢 Start Services" for automatic installation**

**🔧 On first startup, the system:**
- Automatically creates the `.env` file with default values
- Installs necessary pnpm dependencies  
- Builds core and UI packages
- Launches all Docker services
- Configures the production environment

## ⚙️ Quick Configuration

### Initial Configuration

On first startup, the `.env` file is created with default values. You can set your first API key there for a quick start.

```env
# === AGENTIC FORGE CONFIGURATION ===

# Access ports
PUBLIC_PORT=8080          # API and main server
WEB_PORT=3002            # User interface

# Database and cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""        # Leave empty for local use

# Artificial Intelligence - Startup key
LLM_API_KEY="your_preferred_api_key"
LLM_PROVIDER="gemini"          # or "openai", "anthropic", "grok", etc.
LLM_MODEL_NAME="gemini-2.5-pro"   # Model corresponding to provider
LLM_API_BASE_URL=""            # Optional, auto-detected if not provided

# Security
AUTH_TOKEN="$(openssl rand -hex 32)"     # Automatically generated

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 Multi-API Key Management via Web Interface

AgenticForge integrates a powerful **LlmKeyManager** for centralized and dynamic management of your API keys, accessible directly from the web interface.

1.  **Access the interface**: Open your browser at [http://localhost:3002](http://localhost:3002).
2.  **Go to "LLM Key Manager"**: Use the menu to navigate to the key management page.

#### LlmKeyManager Features:

-   **Real-Time Key Addition/Removal**: Add or remove API keys for different providers (OpenAI, Gemini, Anthropic, etc.) without restarting the system.
-   **Activation/Deactivation**: Activate or deactivate keys on the fly.
-   **Automatic Failover**: If an API key fails (request limit reached, error), the system automatically switches to the next valid key to ensure service continuity.
-   **Monitoring and Statistics**: Track your key usage, number of active keys, and number of configured providers.
-   **Validity Tests**: Test the validity of each key directly from the interface.

#### Adding Additional Keys
1. **Via Web Interface**: [localhost:3002](http://localhost:3002) → "API Keys" Tab
2. **Features**:
   - ✅ Real-time key addition/removal
   - ✅ Automatic failover in case of error
   - ✅ Performance monitoring per key
   - ✅ Temporary disabling of faulty keys
   - ✅ Simultaneous multi-provider support

#### Automatic Hierarchy
The system tests keys in order of reliability and automatically switches if a key fails.

---

## 🤖 AI Configuration

### Option 1: Cloud API (Recommended to get started)

| Provider | Recommended Models (2025) | Get an API Key |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-4o`, `gpt-4.1` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-v3`, `deepseek-r1` | [platform.deepseek.com](https://platform.deepseek.com) |

### Option 2: Local AI (For privacy)

#### Ollama
1. **Install Ollama**: [ollama.ai](https://ollama.ai/)
2. **Download a model**:
   ```bash
   ollama pull deepseek-r1:14b  # Recommended for most tasks
   ollama serve
   ```

#### LM Studio
1. **Install LM Studio**: [lmstudio.ai](https://lmstudio.ai/)
2. **Download a model** and start the local server
3. **Configuration**: 
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # Any value
   LLM_MODEL_NAME="your-local-model"
   ```

**Note**: The system automatically detects local servers

---

## 🚀 System Management

### Interactive Management Console

```bash
# Access all features via console
./run-v2.sh
```

### Quick Production Commands

```bash
# Full startup
./run-v2.sh start

# Check service status
./run-v2.sh status

# View system logs
./run-v2.sh logs

# Restart after config modification
./run-v2.sh restart

# Clean system shutdown
./run-v2.sh stop
```

### 🧪 Complete API Tests

AgenticForge includes a complete test suite to validate agent capabilities via API:

```bash
# Interactive test interface
./run-tests.sh

# Quick canvas and todo list tests
./run-tests.sh canvas

# Complete capability tests
./run-tests.sh full
```

**Available test types:**
- ✅ **Canvas & Todo List**: Creation and management of diagrams and task lists
- ✅ **MCP Tools**: Creation and execution of custom tools
- ✅ **Code Generation**: TypeScript, Python and other languages
- ✅ **Planning**: Decomposition and execution of complex tasks
- ✅ **Session Management**: History and conversation continuity
- ✅ **Security**: Error handling and dangerous commands

**All tests are saved in `tests/agent-test-logs/` for detailed analysis.**

### 🔧 Code Quality Control

Code quality tools (lint, TypeScript, format) are integrated into the management console:

```bash
# Complete management console
./run-v2.sh

# Or directly:
pnpm run lint      # Code quality verification
pnpm run typecheck # TypeScript type verification
pnpm run format    # Automatic formatting
```

---

## 🌐 Access to AgenticForge

### Main Interfaces

| Interface | URL | Description |
|-----------|-----|-------------|
| **🎨 Web Interface** | [localhost:3002](http://localhost:3002) | Main interface to interact with the agent |
| **🛠️ API Server** | [localhost:8080](http://localhost:8080) | Backend API and main server |

---

## 🎯 Use Cases and Examples

### 🚀 Quick Start

1. **Access** [localhost:3002](http://localhost:3002) 
2. **Test** real-time MCP tool forging:
   ```
   "Create a custom MCP tool to analyze system logs, 
   code it in TypeScript, integrate it to the worker and test it immediately"
   ```
3. **Or test** direct system execution:
   ```
   "Analyze my system, create a REST API in a new folder, 
   install dependencies with npm, run tests and start the server"
   ```

### 🔧 Custom MCP Tool Forge

#### ⚡ Advanced System Tools
```bash
"Forge an MCP tool that monitors in real time:
- Code the tool in TypeScript with Zod schemas  
- Integrate it directly to the AgenticForge worker
- Interface to monitor CPU/RAM/Processes
- Real-time display in web interface
- Immediate testing of all features"
```

#### 🌐 Smart Web Tools  
```bash
"Create an intelligent MCP scraping tool:
- Generate code with session management
- Integrated Playwright interface to worker
- Data scraping validation schemas
- Real-time results dashboard
- Automatic storage in local database"
```

### 🌐 Full-Stack Applications

#### ⚙️ System Automation & Supervision
```bash
"Read this YAML configuration file, create a Python daemon that:
- Monitor defined system processes
- Automatically execute cron tasks  
- Send logs to /var/log/automation.log
- Restart services in case of failure
- Launch the daemon with systemctl --user"
```

### 📊 Performance Tools

#### 🏃‍♂️ Complete System Benchmarking
```bash
"Run a complete benchmark of this machine:
- Test CPU/RAM/Disk with stress-ng
- Network benchmark with iperf3 to 8.8.8.8
- Measure performance of my local APIs
- Generate HTML report in ./benchmarks/
- Compare with previous results stored locally"
```

#### 📚 Auto-Generated Documentation
```bash
"Recursively scan my project, analyze source code, generate:
- Detailed README.md with architecture diagrams
- API documentation with Swagger/OpenAPI
- UML class diagrams (with PlantUML)
- Tested installation guide on this machine
- Publish everything on a local server with docsify"
```

### 🔧 Project Management

#### 🌳 Git Workflows with Automatic Deployment
```bash
"Configure a complete Git workflow in this repo:
- Install and configure GitFlow with hooks
- Create pre-commit scripts with auto tests
- Configure GitHub Actions or GitLab CI locally  
- Deployment script that builds, tests and restarts services
- Test the complete workflow with a feature branch"
```

### 🎯 Specialized Projects

#### 🤖 Agent with Custom MCP Tool Suite
```bash
"Clone AgenticForge, create a specialized agent with its own MCP tools:
- Forge 5 MCP tools: monitoring, deployment, backup, alerts, analytics
- Each tool coded in TypeScript with complete Zod interfaces
- Web interface on port 3001 showing all tools in action
- SQLite base for persistence + MCP tools to manage it
- Complete test of the automatically forged tool suite"
```

#### 💻 Intelligent System Administration  
```bash
"Analyze this Linux server and create an admin dashboard:
- Real-time monitor: CPU, RAM, disk, network
- Systemd service management with web interface
- Automatic backup of important configurations
- Email/Slack alerts in case of problems
- Scheduled maintenance scripts
- Interface accessible via nginx on port 8080"
```

**🔥 Unique Power**: 
- **🛠️ MCP Forge**: Creates custom MCP tools in TypeScript, integrates them to the worker and tests them immediately
- **⚡ Direct Execution**: Complete system access - installation, configuration, testing, automated deployment
- **🎯 Total Transparency**: View your forged MCP tools in action directly in the web interface

---

### Advanced System Management

| Action | Command | Usage |
|--------|----------|-----------|
| **Complete Console** | `./run-v2.sh` | Main management interface |
| **Quick Startup** | `./run-v2.sh start` | Direct system launch |
| **Monitoring** | `./run-v2.sh status` | Docker service status |
| **Live Logs** | `./run-v2.sh logs` | Real-time monitoring |
| **Restart** | `./run-v2.sh restart` | After config modification |
| **Maintenance** | `./run-v2.sh` → Options 7-14 | Tests, lint, format, rebuild |

---

## ⚙️ Production Architecture

### Technical Stack

- **🧠 Main Server**: REST API, AI orchestration, session management
- **🌐 Web Interface**: React application with real-time streaming
- **💾 Redis**: High-performance cache and message broker
- **🗄️ PostgreSQL**: Persistent storage of sessions and tools
- **🐳 Docker Compose**: Complete service orchestration
- **📊 OpenTelemetry**: Observability and monitoring

### Tool Forging Process

1. **Analysis** → AI understands user needs
2. **Design** → TypeScript/Python code generation
3. **Validation** → Automatic tests and verification
4. **Integration** → Addition to tool catalog
5. **Execution** → Instantly available in interface

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgements

- **[FastMCP](https://github.com/punkpeye/fastmcp)**: Ultra-performant MCP framework - the rocket that propels AgenticForge 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**: Revolutionary protocol for LLM interactions
- **[Docker](https://docker.com)**: Containerization and isolation
- **[Redis](https://redis.io)**: High-performance data structures
- **[Playwright](https://playwright.dev)**: Modern web automation
- **Open Source Community**: For inspiration and collaboration

---

## Support

- **🚨 Issues**: [GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 Documentation**: [Project Wiki](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord**: [Join the community](https://discord.gg/VNtXQByKfg) - *Share your creations, get real-time help and discover the latest news in advance*

---

<div align="center">

**🔨 A blacksmith forges his hammers.** **🤖 AgenticForge forges its own capabilities.**

_Forge your technological future._

[![Get Started](https://img.shields.io/badge/🚀_Get_Started-brightgreen?style=for-the-badge)](./run-v2.sh)

</div>