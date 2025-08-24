<p align="center">
  <img src="assets/title.png" alt="AgenticForge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
<p align="center">
  <strong>🌐 可用语言</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      您全新的100%自主、免费和本地AI代理
</h3>

<p align="center">
  <em>
    您全新的100%自主、免费和本地AI代理，确保完全隐私。完全基于MCP协议设计，执行复杂任务，编写代码并锻造自己的工具，直接在用户界面中显示以实现完全透明。借助其智能API密钥路由器（遵循可配置的层次结构），它会自动切换以确保不会用完请求。准备好探索私人AI的未来了吗？
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

## 为什么选择AgenticForge？

🔒 **完全本地和私有** - 所有内容都在您的机器上运行 — 无云，无数据共享。您的文件、对话和工具保持私有。

🛠️ **MCP自工具锻造** - AgenticForge直接用TypeScript和Zod模式编写自定义MCP工具，实时集成到工作器并在界面中显示，实现完全透明。

💰 **延长免费运行** - 通过密钥管理技巧，特别是使用Qwen，AgenticForge可以连续运行数天而无需费用。

🤖 **子代理控制** - 能够编排和控制其他命令行界面(CLI)代理，以委派和并行处理复杂任务。

💻 **自主编码助手** - 需要代码吗？它可以编写、调试和执行Python、TypeScript、Bash等程序 — 无需监督。

🧠 **智能工具选择** - 您提问，它会自动找到最佳工具来完成工作。就像拥有一群随时准备帮助的专家。

📋 **计划和执行复杂任务** - 从文件管理到网页抓取 — 它可以将大任务分解为步骤并锻造工具来完成工作。

🌐 **智能网页导航** - AgenticForge可以自主浏览互联网 — 搜索、阅读、提取信息、自动化任务 — 全部无需干预。

🔄 **智能LlmKeyManager** - 高级API密钥管理系统，具有自动故障转移、性能监控和临时禁用故障密钥功能。

🚀 **原生MCP锻造** - 使用MCP协议和FastMCP实时创建、修改和部署自定义工具。每个工具都经过编码、测试并自动集成到工作器中。使用MCP创建的工具可直接供n8n代理访问。

---

## 🛠️ ⚠️ 积极进行中的工作

🙏 这个项目最初是为了证明MCP比API更好而开始的，现在已经超出了预期。我们非常感谢您在我们继续前进的过程中提供的贡献、反馈和耐心。

---

## 📋 先决条件

**安装所需：**

- **Docker Engine & Docker Compose**：用于主要服务
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/)（推荐）：Windows | Mac | Linux
  - 或 [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**：用于构建和本地工作器
  - [下载 Node.js](https://nodejs.org/)
- **pnpm**：包管理器
  ```bash
  npm install -g pnpm
  ```
- **Git**：用于克隆项目

### 🖥️ 系统兼容性

> **AgenticForge** 设计为在 **Linux** 或 **macOS** 上部署。  
> **Windows 不被官方支持**。

---

## 🚀 生产安装

### 🤖 超简单安装（100% 自动）

**选项 1：一行安装**
```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**选项 2：经典安装**
```bash
# 1. 克隆项目
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. 完全自动安装
chmod +x run-v2.sh
./run-v2.sh install
```

**选项 3：交互式安装**
```bash
# 1. 克隆项目
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. 启动 AgenticForge 管理控制台
chmod +x run-v2.sh
./run-v2.sh
```

**生产管理控制台：**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & 服务
    1) 🟢 启动服务            5) 📊 工作器日志
    2) 🔄 重启所有            6) 🐚 容器Shell
    3) 🔴 停止服务            7) 🔨 重建所有
    4) ⚡ 状态                8) 🐳 Docker日志

    测试 & 质量
    9) 🔬 仅单元测试         12) 🔍 Lint代码
   10) 🔗 集成测试           13) ✨ 格式化代码
   11) 🧪 所有测试           14) 📘 类型检查

   15) 🚪 退出
```

**选择 "1) 🟢 启动服务" 进行自动安装**

**🔧 首次启动时，系统：**
- 自动创建带有默认值的 `.env` 文件
- 安装必要的 pnpm 依赖项  
- 构建核心和UI包
- 启动所有 Docker 服务
- 配置生产环境

## ⚙️ 快速配置

### 初始配置

首次启动时，`.env` 文件会使用默认值创建。您可以在那里设置第一个API密钥以快速启动。

```env
# === AGENTIC FORGE 配置 ===

# 访问端口
PUBLIC_PORT=8080          # API和主服务器
WEB_PORT=3002             # 用户界面

# 数据库和缓存
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""         # 本地使用时留空

# 人工智能 - 启动密钥
LLM_API_KEY="您的首选API密钥"
LLM_PROVIDER="gemini"          # 或 "openai", "anthropic", "grok" 等
LLM_MODEL_NAME="gemini-2.5-pro"   # 与提供商对应的模型
LLM_API_BASE_URL=""            # 可选，如果未提供则自动检测

# 安全
AUTH_TOKEN="$(openssl rand -hex 32)"     # 自动生成

# 环境
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 通过Web界面管理多API密钥

AgenticForge集成了强大的 **LlmKeyManager**，用于集中和动态管理您的API密钥，可直接从Web界面访问。

1.  **访问界面**：在浏览器中打开 [http://localhost:3002](http://localhost:3002)。
2.  **转到"LLM密钥管理器"**：使用菜单导航到密钥管理页面。

#### LlmKeyManager 功能：

-   **实时添加/删除密钥**：添加或删除不同提供商（OpenAI、Gemini、Anthropic等）的API密钥，无需重启系统。
-   **激活/停用**：即时激活或停用密钥。
-   **自动故障转移**：如果API密钥失败（达到请求限制、错误），系统会自动切换到下一个有效密钥以确保服务连续性。
-   **监控和统计**：跟踪您的密钥使用情况、活动密钥数量和配置的提供商数量。
-   **有效性测试**：直接从界面测试每个密钥的有效性。

#### 添加额外密钥
1. **通过Web界面**：[localhost:3002](http://localhost:3002) → "API密钥"选项卡
2. **功能**：
   - ✅ 实时添加/删除密钥
   - ✅ 错误时自动故障转移
   - ✅ 每个密钥的性能监控
   - ✅ 临时禁用故障密钥
   - ✅ 同时支持多提供商

#### 自动层次结构
系统按可靠性顺序测试密钥，并在密钥失败时自动切换。

---

## 🤖 AI配置

### 选项 1：云API（推荐用于入门）

| 提供商 | 推荐模型 (2025) | 获取API密钥 |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-4o`, `gpt-4.1` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-v3`, `deepseek-r1` | [platform.deepseek.com](https://platform.deepseek.com) |

### 选项 2：本地AI（用于隐私）

#### Ollama
1. **安装 Ollama**：[ollama.ai](https://ollama.ai/)
2. **下载模型**：
   ```bash
   ollama pull deepseek-r1:14b  # 推荐用于大多数任务
   ollama serve
   ```

#### LM Studio
1. **安装 LM Studio**：[lmstudio.ai](https://lmstudio.ai/)
2. **下载模型**并启动本地服务器
3. **配置**： 
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # 任意值
   LLM_MODEL_NAME="您的本地模型"
   ```

**注意**：系统会自动检测本地服务器

---

## 🚀 系统管理

### 交互式管理控制台

```bash
# 通过控制台访问所有功能
./run-v2.sh
```

### 快速生产命令

```bash
# 完整启动
./run-v2.sh start

# 检查服务状态
./run-v2.sh status

# 查看系统日志
./run-v2.sh logs

# 配置修改后重启
./run-v2.sh restart

# 干净关闭系统
./run-v2.sh stop
```

### 🧪 完整API测试

AgenticForge包含完整的测试套件，通过API验证代理功能：

```bash
# 交互式测试界面
./run-tests.sh

# 快速画布和待办事项列表测试
./run-tests.sh canvas

# 完整功能测试
./run-tests.sh full
```

**可用测试类型：**
- ✅ **画布和待办事项列表**：图表和任务列表的创建和管理
- ✅ **MCP工具**：自定义工具的创建和执行
- ✅ **代码生成**：TypeScript、Python和其他语言
- ✅ **规划**：复杂任务的分解和执行
- ✅ **会话管理**：历史记录和对话连续性
- ✅ **安全**：错误处理和危险命令

**所有测试都保存在 `tests/agent-test-logs/` 中以供详细分析。**

### 🔧 代码质量控制

代码质量工具（lint、TypeScript、格式化）已集成到管理控制台中：

```bash
# 完整管理控制台
./run-v2.sh

# 或直接：
pnpm run lint      # 代码质量验证
pnpm run typecheck # TypeScript类型验证
pnpm run format    # 自动格式化
```

---

## 🌐 访问AgenticForge

### 主要界面

| 界面 | URL | 描述 |
|-----------|-----|-------------|
| **🎨 Web界面** | [localhost:3002](http://localhost:3002) | 与代理交互的主界面 |
| **🛠️ API服务器** | [localhost:8080](http://localhost:8080) | 后端API和主服务器 |

---

## 🎯 使用案例和示例

### 🚀 快速开始

1. **访问** [localhost:3002](http://localhost:3002) 
2. **测试** 实时MCP工具锻造：
   ```
   "创建一个自定义MCP工具来分析系统日志，
   用TypeScript编码，集成到工作器并立即测试"
   ```
3. **或测试** 直接系统执行：
   ```
   "分析我的系统，在新文件夹中创建REST API，
   使用npm安装依赖，运行测试并启动服务器"
   ```

### 🔧 自定义MCP工具锻造

#### ⚡ 高级系统工具
```bash
"锻造一个实时监控的MCP工具：
- 用TypeScript和Zod模式编码工具  
- 直接集成到AgenticForge工作器
- 监控CPU/RAM/进程的界面
- Web界面中的实时显示
- 所有功能的即时测试"
```

#### 🌐 智能Web工具  
```bash
"创建一个智能MCP抓取工具：
- 生成带会话管理的代码
- 集成到工作器的Playwright界面
- 数据抓取验证模式
- 实时结果仪表板
- 自动存储到本地数据库"
```

### 🌐 全栈应用程序

#### ⚙️ 系统自动化和监控
```bash
"读取此YAML配置文件，创建一个Python守护进程：
- 监控定义的系统进程
- 自动执行cron任务  
- 将日志发送到/var/log/automation.log
- 故障时重启服务
- 使用systemctl --user启动守护进程"
```

### 📊 性能工具

#### 🏃‍♂️ 完整系统基准测试
```bash
"运行此机器的完整基准测试：
- 使用stress-ng测试CPU/RAM/磁盘
- 使用iperf3到8.8.8.8进行网络基准测试
- 测量本地API的性能
- 在./benchmarks/中生成HTML报告
- 与本地存储的先前结果进行比较"
```

#### 📚 自动生成文档
```bash
"递归扫描我的项目，分析源代码，生成：
- 带架构图的详细README.md
- 带Swagger/OpenAPI的API文档
- UML类图（使用PlantUML）
- 在此机器上测试的安装指南
- 使用docsify在本地服务器上发布所有内容"
```

### 🔧 项目管理

#### 🌳 Git工作流和自动部署
```bash
"在此仓库中配置完整的Git工作流：
- 安装和配置带钩子的GitFlow
- 创建带自动测试的预提交脚本
- 在本地配置GitHub Actions或GitLab CI  
- 部署脚本，构建、测试和重启服务
- 使用功能分支测试完整工作流"
```

### 🎯 专业化项目

#### 🤖 带自定义MCP工具套件的代理
```bash
"克隆AgenticForge，创建一个具有自己MCP工具的专业化代理：
- 锻造5个MCP工具：监控、部署、备份、警报、分析
- 每个工具都用TypeScript编码，具有完整的Zod接口
- 在端口3001的Web界面显示所有工具的实际操作
- 用于持久化的SQLite数据库 + 用于管理它的MCP工具
- 自动锻造工具套件的完整测试"
```

#### 💻 智能系统管理  
```bash
"分析此Linux服务器并创建管理仪表板：
- 实时监控：CPU、RAM、磁盘、网络
- 带Web界面的systemd服务管理
- 重要配置的自动备份
- 出现问题时的电子邮件/Slack警报
- 预定的维护脚本
- 可通过端口8080上的nginx访问的界面"
```

**🔥 独特功能**: 
- **🛠️ MCP锻造**：在TypeScript中创建自定义MCP工具，集成到工作器并立即测试
- **⚡ 直接执行**：完整的系统访问 - 安装、配置、测试、自动部署
- **🎯 完全透明**：直接在Web界面中查看锻造的MCP工具的实际操作

---

### 高级系统管理

| 操作 | 命令 | 用途 |
|--------|----------|-----------|
| **完整控制台** | `./run-v2.sh` | 主管理界面 |
| **快速启动** | `./run-v2.sh start` | 直接系统启动 |
| **监控** | `./run-v2.sh status` | Docker服务状态 |
| **实时日志** | `./run-v2.sh logs` | 实时监控 |
| **重启** | `./run-v2.sh restart` | 配置修改后 |
| **维护** | `./run-v2.sh` → 选项 7-14 | 测试、lint、格式化、重建 |

---

## ⚙️ 生产架构

### 技术栈

- **🧠 主服务器**：REST API、AI编排、会话管理
- **🌐 Web界面**：带实时流的React应用程序
- **💾 Redis**：高性能缓存和消息代理
- **🗄️ PostgreSQL**：会话和工具的持久化存储
- **🐳 Docker Compose**：完整服务编排
- **📊 OpenTelemetry**：可观察性和监控

### 工具锻造过程

1. **分析** → AI理解用户需求
2. **设计** → TypeScript/Python代码生成
3. **验证** → 自动测试和验证
4. **集成** → 添加到工具目录
5. **执行** → 在界面中即时可用

---

## 许可证

本项目根据MIT许可证授权。有关详细信息，请参阅 `LICENSE` 文件。

---

## 致谢

- **[FastMCP](https://github.com/punkpeye/fastmcp)**：高性能MCP框架 - 推动AgenticForge的火箭 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**：LLM交互的革命性协议
- **[Docker](https://docker.com)**：容器化和隔离
- **[Redis](https://redis.io)**：高性能数据结构
- **[Playwright](https://playwright.dev)**：现代Web自动化
- **开源社区**：灵感和协作

---

## 支持

- **🚨 问题**：[GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 讨论**：[GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 文档**：[项目Wiki](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord**：[加入社区](https://discord.gg/VNtXQByKfg) - *分享您的创作，获得实时帮助并提前了解最新消息*

---

<div align="center">

**🔨 铁匠锻造他的锤子。** **🤖 AgenticForge锻造自己的能力。**

_锻造您的技术未来。_

[![开始](https://img.shields.io/badge/🚀_开始-brightgreen?style=for-the-badge)](./run-v2.sh)

</div>