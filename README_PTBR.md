<p align="center">
  <img src="assets/title.png" alt="AgenticForge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
<p align="center">
  <strong>🌐 Idiomas Disponíveis</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      Seu novo agente de IA 100% autônomo, gratuito e local
</h3>

<p align="center">
  <em>
    Seu novo agente de IA 100% autônomo, gratuito e local, garantindo total privacidade. Projetado inteiramente com o protocolo MCP, ele executa tarefas complexas, escreve código e forja suas próprias ferramentas, que são exibidas diretamente na interface do usuário para total transparência. Graças ao seu roteador de chaves API inteligente que segue uma hierarquia configurável, ele alterna automaticamente para nunca ficar sem requisições. Pronto para explorar o futuro da IA privada?
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

## Por que AgenticForge?

🔒 **Totalmente Local e Privado** - Tudo executa em sua máquina — sem nuvem, sem compartilhamento de dados. Seus arquivos, conversas e ferramentas permanecem privados.

🛠️ **Auto-Forjamento de Ferramentas MCP** - AgenticForge codifica diretamente ferramentas MCP personalizadas em TypeScript com esquemas Zod, as integra ao worker em tempo real e as exibe na interface com total transparência.

💰 **Operação Gratuita Prolongada** - Graças a um truque de gerenciamento de chaves, especialmente com Qwen, o AgenticForge pode executar continuamente por vários dias sem custo.

🤖 **Controle de Sub-Agentes** - Capaz de orquestrar e controlar outros agentes de interface de linha de comando (CLI) para delegar e paralelizar tarefas complexas.

💻 **Assistente de Codificação Autônomo** - Precisa de código? Ele pode escrever, depurar e executar programas em Python, TypeScript, Bash e mais — sem supervisão.

🧠 **Seleção Inteligente de Ferramentas** - Você pergunta, ele encontra automaticamente a melhor ferramenta para o trabalho. Como ter uma forja de especialistas prontos para ajudar.

📋 **Planeja e Executa Tarefas Complexas** - Desde gerenciamento de arquivos até web scraping — ele pode dividir tarefas grandes em etapas e forjar as ferramentas para realizar o trabalho.

🌐 **Navegação Web Inteligente** - O AgenticForge pode navegar na internet autonomamente — pesquisar, ler, extrair informações, automatizar tarefas — tudo sem intervenção.

🔄 **LlmKeyManager Inteligente** - Sistema avançado de gerenciamento de chaves API com failover automático, monitoramento de desempenho e desativação temporária de chaves com falha.

🚀 **Forja MCP Nativa** - Usa o protocolo MCP com FastMCP para criar, modificar e implantar ferramentas personalizadas em tempo real. Cada ferramenta é codificada, testada e integrada automaticamente ao worker. As ferramentas criadas com MCP são diretamente acessíveis para um agente n8n.

---

## 🛠️ ⚠️ Trabalho Ativo em Andamento

🙏 Este projeto começou para provar que o MCP era melhor que a API e cresceu além das expectativas. Contribuições, feedback e paciência são profundamente apreciados enquanto seguimos em frente.

---

## 📋 Pré-requisitos

**Necessário para instalação:**

- **Docker Engine & Docker Compose**: Para serviços principais
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recomendado): Windows | Mac | Linux
  - Ou [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**: Para build e worker local
  - [Baixar Node.js](https://nodejs.org/)
- **pnpm**: Gerenciador de pacotes
  ```bash
  npm install -g pnpm
  ```
- **Git**: Para clonar o projeto

### 🖥️ Compatibilidade do Sistema

> **AgenticForge** é projetado para ser implantado em **Linux** ou **macOS**.  
> **Windows não é oficialmente suportado**.

---

## 🚀 Instalação de Produção

### 🤖 Instalação Ultra-Simples (100% Automática)

**Opção 1: Instalação em uma linha**
```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**Opção 2: Instalação clássica**
```bash
# 1. Clonar o projeto
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Instalação completamente automatizada
chmod +x run-v2.sh
./run-v2.sh install
```

**Opção 3: Instalação interativa**
```bash
# 1. Clonar o projeto
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Iniciar o console de gerenciamento do AgenticForge
chmod +x run-v2.sh
./run-v2.sh
```

**Console de Gerenciamento de Produção:**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & Serviços
    1) 🟢 Iniciar Serviços            5) 📊 Logs do Worker
    2) 🔄 Reiniciar Todos             6) 🐚 Shell do Contêiner
    3) 🔴 Parar Serviços              7) 🔨 Reconstruir Todos
    4) ⚡ Status                      8) 🐳 Logs do Docker

    Testes & Qualidade
    9) 🔬 Apenas Testes Unitários     12) 🔍 Lint de Código
   10) 🔗 Testes de Integração        13) ✨ Formatar Código
   11) 🧪 Todos os Testes             14) 📘 Verificação de Tipos

   15) 🚪 Sair
```

**Escolha "1) 🟢 Iniciar Serviços" para instalação automática**

**🔧 Na primeira inicialização, o sistema:**
- Cria automaticamente o arquivo `.env` com valores padrão
- Instala as dependências pnpm necessárias  
- Compila os pacotes core e UI
- Inicia todos os serviços Docker
- Configura o ambiente de produção

## ⚙️ Configuração Rápida

### Configuração Inicial

Na primeira inicialização, o arquivo `.env` é criado com valores padrão. Você pode definir sua primeira chave API lá para uma inicialização rápida.

```env
# === CONFIGURAÇÃO DO AGENTIC FORGE ===

# Portas de acesso
PUBLIC_PORT=8080          # API e servidor principal
WEB_PORT=3002             # Interface do usuário

# Banco de dados e cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""         # Deixe vazio para uso local

# Inteligência Artificial - Chave de inicialização
LLM_API_KEY="sua_chave_api_preferida"
LLM_PROVIDER="gemini"          # ou "openai", "anthropic", "grok", etc.
LLM_MODEL_NAME="gemini-2.5-pro"   # Modelo correspondente ao provedor
LLM_API_BASE_URL=""            # Opcional, detectado automaticamente se não fornecido

# Segurança
AUTH_TOKEN="$(openssl rand -hex 32)"     # Gerado automaticamente

# Ambiente
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 Gerenciamento de Chaves API Múltiplas via Interface Web

O AgenticForge integra um **LlmKeyManager** poderoso para gerenciamento centralizado e dinâmico de suas chaves API, acessível diretamente da interface web.

1.  **Acesse a interface**: Abra seu navegador em [http://localhost:3002](http://localhost:3002).
2.  **Vá para "Gerenciador de Chaves LLM"**: Use o menu para navegar até a página de gerenciamento de chaves.

#### Recursos do LlmKeyManager:

-   **Adição/Remoção de Chaves em Tempo Real**: Adicione ou remova chaves API para diferentes provedores (OpenAI, Gemini, Anthropic, etc.) sem reiniciar o sistema.
-   **Ativação/Desativação**: Ative ou desative chaves instantaneamente.
-   **Failover Automático**: Se uma chave API falhar (limite de requisições atingido, erro), o sistema alterna automaticamente para a próxima chave válida para garantir a continuidade do serviço.
-   **Monitoramento e Estatísticas**: Acompanhe o uso de suas chaves, número de chaves ativas e número de provedores configurados.
-   **Testes de Validade**: Teste a validade de cada chave diretamente da interface.

#### Adicionando Chaves Adicionais
1. **Via Interface Web**: [localhost:3002](http://localhost:3002) → Aba "Chaves API"
2. **Recursos**:
   - ✅ Adição/remoção de chaves em tempo real
   - ✅ Failover automático em caso de erro
   - ✅ Monitoramento de desempenho por chave
   - ✅ Desativação temporária de chaves com falha
   - ✅ Suporte a múltiplos provedores simultaneamente

#### Hierarquia Automática
O sistema testa as chaves em ordem de confiabilidade e alterna automaticamente se uma chave falhar.

---

## 🤖 Configuração de IA

### Opção 1: API na Nuvem (Recomendado para começar)

| Provedor | Modelos Recomendados (2025) | Obter uma Chave API |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-4o`, `gpt-4.1` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-v3`, `deepseek-r1` | [platform.deepseek.com](https://platform.deepseek.com) |

### Opção 2: IA Local (Para privacidade)

#### Ollama
1. **Instalar Ollama**: [ollama.ai](https://ollama.ai/)
2. **Baixar um modelo**:
   ```bash
   ollama pull deepseek-r1:14b  # Recomendado para a maioria das tarefas
   ollama serve
   ```

#### LM Studio
1. **Instalar LM Studio**: [lmstudio.ai](https://lmstudio.ai/)
2. **Baixar um modelo** e iniciar o servidor local
3. **Configuração**: 
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # Qualquer valor
   LLM_MODEL_NAME="seu-modelo-local"
   ```

**Nota**: O sistema detecta automaticamente servidores locais

---

## 🚀 Gerenciamento do Sistema

### Console de Gerenciamento Interativo

```bash
# Acesse todos os recursos via console
./run-v2.sh
```

### Comandos de Produção Rápidos

```bash
# Inicialização completa
./run-v2.sh start

# Verificar status dos serviços
./run-v2.sh status

# Visualizar logs do sistema
./run-v2.sh logs

# Reiniciar após modificação de configuração
./run-v2.sh restart

# Desligamento limpo do sistema
./run-v2.sh stop
```

### 🧪 Testes API Completos

O AgenticForge inclui um conjunto completo de testes para validar as capacidades do agente via API:

```bash
# Interface de testes interativa
./run-tests.sh

# Testes rápidos de canvas e lista de tarefas
./run-tests.sh canvas

# Testes completos de capacidades
./run-tests.sh full
```

**Tipos de testes disponíveis:**
- ✅ **Canvas e Lista de Tarefas**: Criação e gerenciamento de diagramas e listas de tarefas
- ✅ **Ferramentas MCP**: Criação e execução de ferramentas personalizadas
- ✅ **Geração de Código**: TypeScript, Python e outras linguagens
- ✅ **Planejamento**: Decomposição e execução de tarefas complexas
- ✅ **Gerenciamento de Sessões**: Histórico e continuidade das conversas
- ✅ **Segurança**: Tratamento de erros e comandos perigosos

**Todos os testes são salvos em `tests/agent-test-logs/` para análise detalhada.**

### 🔧 Controle de Qualidade do Código

As ferramentas de qualidade de código (lint, TypeScript, formatação) estão integradas ao console de gerenciamento:

```bash
# Console de gerenciamento completo
./run-v2.sh

# Ou diretamente:
pnpm run lint      # Verificação de qualidade do código
pnpm run typecheck # Verificação de tipos TypeScript
pnpm run format    # Formatação automática
```

---

## 🌐 Acesso ao AgenticForge

### Interfaces Principais

| Interface | URL | Descrição |
|-----------|-----|-------------|
| **🎨 Interface Web** | [localhost:3002](http://localhost:3002) | Interface principal para interagir com o agente |
| **🛠️ Servidor API** | [localhost:8080](http://localhost:8080) | API backend e servidor principal |

---

## 🎯 Casos de Uso e Exemplos

### 🚀 Início Rápido

1. **Acesse** [localhost:3002](http://localhost:3002) 
2. **Teste** a forja de ferramentas MCP em tempo real:
   ```
   "Crie uma ferramenta MCP personalizada para analisar logs do sistema, 
   codifique-a em TypeScript, integre-a ao worker e teste-a imediatamente"
   ```
3. **Ou teste** a execução direta do sistema:
   ```
   "Analise meu sistema, crie uma API REST em uma nova pasta, 
   instale dependências com npm, execute testes e inicie o servidor"
   ```

### 🔧 Forja de Ferramentas MCP Personalizadas

#### ⚡ Ferramentas Avançadas do Sistema
```bash
"Forje uma ferramenta MCP que monitore em tempo real:
- Codifique a ferramenta em TypeScript com esquemas Zod  
- Integre-a diretamente ao worker do AgenticForge
- Interface para monitorar CPU/RAM/Processos
- Exibição em tempo real na interface web
- Teste imediato de todos os recursos"
```

#### 🌐 Ferramentas Web Inteligentes  
```bash
"Crie uma ferramenta de scraping MCP inteligente:
- Gere código com gerenciamento de sessões
- Interface Playwright integrada ao worker
- Esquemas de validação de dados coletados
- Painel de resultados em tempo real
- Armazenamento automático em banco de dados local"
```

### 🌐 Aplicações Full-Stack

#### ⚙️ Automação e Supervisão do Sistema
```bash
"Leia este arquivo de configuração YAML, crie um daemon Python que:
- Monitore processos do sistema definidos
- Execute tarefas cron automaticamente  
- Envie logs para /var/log/automation.log
- Reinicie serviços em caso de falha
- Inicie o daemon com systemctl --user"
```

### 📊 Ferramentas de Desempenho

#### 🏃‍♂️ Benchmarking Completo do Sistema
```bash
"Execute um benchmark completo desta máquina:
- Teste CPU/RAM/Disco com stress-ng
- Benchmark de rede com iperf3 para 8.8.8.8
- Meça o desempenho de minhas APIs locais
- Gere um relatório HTML em ./benchmarks/
- Compare com resultados anteriores armazenados localmente"
```

#### 📚 Documentação Auto-Gerada
```bash
"Analise recursivamente meu projeto, analise o código-fonte, gere:
- README.md detalhado com diagramas de arquitetura
- Documentação API com Swagger/OpenAPI
- Diagramas de classes UML (com PlantUML)
- Guia de instalação testado nesta máquina
- Publique tudo em um servidor local com docsify"
```

### 🔧 Gerenciamento de Projetos

#### 🌳 Workflows Git com Implantação Automática
```bash
"Configure um workflow Git completo neste repositório:
- Instale e configure GitFlow com hooks
- Crie scripts pre-commit com testes automáticos
- Configure GitHub Actions ou GitLab CI localmente  
- Script de implantação que compila, testa e reinicia os serviços
- Teste o workflow completo com um branch de feature"
```

### 🎯 Projetos Especializados

#### 🤖 Agente com Conjunto de Ferramentas MCP Personalizado
```bash
"Clone o AgenticForge, crie um agente especializado com suas próprias ferramentas MCP:
- Forje 5 ferramentas MCP: monitoramento, implantação, backup, alertas, análise
- Cada ferramenta codificada em TypeScript com interfaces Zod completas
- Interface web na porta 3001 mostrando todas as ferramentas em ação
- Base SQLite para persistência + ferramentas MCP para gerenciá-la
- Teste completo do conjunto de ferramentas forjadas automaticamente"
```

#### 💻 Administração de Sistemas Inteligente  
```bash
"Analise este servidor Linux e crie um painel de administração:
- Monitor em tempo real: CPU, RAM, disco, rede
- Gerenciamento de serviços systemd com interface web
- Backup automático de configurações importantes
- Alertas por email/Slack em caso de problemas
- Scripts de manutenção programados
- Interface acessível via nginx na porta 8080"
```

**🔥 Poder Único**: 
- **🛠️ Forja MCP**: Cria ferramentas MCP personalizadas em TypeScript, integra-as ao worker e testa-as imediatamente
- **⚡ Execução Direta**: Acesso completo ao sistema - instalação, configuração, testes, implantação automatizada
- **🎯 Transparência Total**: Visualize suas ferramentas MCP forjadas em ação diretamente na interface web

---

### Gerenciamento Avançado do Sistema

| Ação | Comando | Uso |
|--------|----------|-----------|
| **Console Completo** | `./run-v2.sh` | Interface principal de gerenciamento |
| **Inicialização Rápida** | `./run-v2.sh start` | Inicialização direta do sistema |
| **Monitoramento** | `./run-v2.sh status` | Status dos serviços Docker |
| **Logs em Tempo Real** | `./run-v2.sh logs` | Monitoramento em tempo real |
| **Reinicialização** | `./run-v2.sh restart` | Após modificação de configuração |
| **Manutenção** | `./run-v2.sh` → Opções 7-14 | Testes, lint, formatação, reconstrução |

---

## ⚙️ Arquitetura de Produção

### Stack Técnica

- **🧠 Servidor Principal**: API REST, orquestração de IA, gerenciamento de sessões
- **🌐 Interface Web**: Aplicação React com streaming em tempo real
- **💾 Redis**: Cache de alta performance e message broker
- **🗄️ PostgreSQL**: Armazenamento persistente de sessões e ferramentas
- **🐳 Docker Compose**: Orquestração completa de serviços
- **📊 OpenTelemetry**: Observabilidade e monitoramento

### Processo de Forja de Ferramentas

1. **Análise** → IA entende as necessidades do usuário
2. **Design** → Geração de código TypeScript/Python
3. **Validação** → Testes automáticos e verificação
4. **Integração** → Adição ao catálogo de ferramentas
5. **Execução** → Disponível instantaneamente na interface

---

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para detalhes.

---

## Agradecimentos

- **[FastMCP](https://github.com/punkpeye/fastmcp)**: Framework MCP de alta performance - o foguete que impulsiona o AgenticForge 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**: Protocolo revolucionário para interações com LLMs
- **[Docker](https://docker.com)**: Contêinerização e isolamento
- **[Redis](https://redis.io)**: Estruturas de dados de alta performance
- **[Playwright](https://playwright.dev)**: Automação web moderna
- **Comunidade de Código Aberto**: Por inspiração e colaboração

---

## Suporte

- **🚨 Problemas**: [GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 Discussões**: [GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 Documentação**: [Wiki do Projeto](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord**: [Junte-se à comunidade](https://discord.gg/VNtXQByKfg) - *Compartilhe suas criações, obtenha ajuda em tempo real e descubra as últimas notícias com antecedência*

---

<div align="center">

**🔨 Um ferreiro forja seus martelos.** **🤖 AgenticForge forja suas próprias capacidades.**

_Forje seu futuro tecnológico._

[![Começar](https://img.shields.io/badge/🚀_Começar-brightgreen?style=for-the-badge)](./run-v2.sh)

</div>