<p align="center">
  <img src="assets/title.png" alt="AgenticForge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
<p align="center">
  <strong>🌐 Idiomas disponibles</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      Su nuevo agente de IA 100% autónomo, gratuito y local
</h3>

<p align="center">
  <em>
    Su nuevo agente de IA 100% autónomo, gratuito y local, garantizando privacidad total. Diseñado completamente con el protocolo MCP, ejecuta tareas complejas, escribe código y forja sus propias herramientas, que se muestran directamente en la interfaz de usuario para total transparencia. Gracias a su enrutador de claves API inteligente que sigue una jerarquía configurable, cambia automáticamente para no quedarse sin solicitudes. ¿Listo para explorar el futuro de la IA privada?
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

## ¿Por qué AgenticForge?

🔒 **Totalmente Local y Privado** - Todo funciona en su máquina — sin nube, sin compartir datos. Sus archivos, conversaciones y herramientas permanecen privados.

🛠️ **Auto-Forjado de Herramientas MCP** - AgenticForge codifica directamente herramientas MCP personalizadas en TypeScript con esquemas Zod, las integra al worker en tiempo real y las muestra en la interfaz con total transparencia.

💰 **Funcionamiento Gratuito Prolongado** - Gracias a un truco de gestión de claves, especialmente con Qwen, AgenticForge puede funcionar continuamente durante varios días sin costo.

🤖 **Control de Sub-Agentes** - Capaz de orquestar y controlar otros agentes de interfaz de línea de comandos (CLI) para delegar y paralelizar tareas complejas.

💻 **Asistente de Codificación Autónomo** - ¿Necesita código? Puede escribir, depurar y ejecutar programas en Python, TypeScript, Bash y más — sin supervisión.

🧠 **Selección Inteligente de Herramientas** - Usted pregunta, automáticamente encuentra la mejor herramienta para el trabajo. Como tener una forja de expertos listos para ayudar.

📋 **Planea y Ejecuta Tareas Complejas** - Desde gestión de archivos hasta scraping web — puede dividir tareas grandes en pasos y forjar las herramientas para realizar el trabajo.

🌐 **Navegación Web Inteligente** - AgenticForge puede navegar por internet de forma autónoma — buscar, leer, extraer información, automatizar tareas — todo sin intervención.

🔄 **LlmKeyManager Inteligente** - Sistema avanzado de gestión de claves API con conmutación automática, monitoreo de rendimiento y desactivación temporal de claves defectuosas.

🚀 **Forja MCP Nativa** - Utiliza el protocolo MCP con FastMCP para crear, modificar y desplegar herramientas personalizadas en tiempo real. Cada herramienta se codifica, prueba e integra automáticamente al worker. Las herramientas creadas con MCP son directamente accesibles para un agente n8n.

---

## 🛠️ ⚠️ Trabajo Activo en Curso

🙏 Este proyecto comenzó para demostrar que MCP era mejor que API y ha crecido más allá de las expectativas. Las contribuciones, comentarios y paciencia son profundamente apreciadas mientras seguimos forjando.

---

## 📋 Requisitos Previos

**Requeridos para la instalación:**

- **Docker Engine & Docker Compose**: Para servicios principales
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recomendado): Windows | Mac | Linux
  - O [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+**: Para construcción y worker local
  - [Descargar Node.js](https://nodejs.org/)
- **pnpm**: Gestor de paquetes
  ```bash
  npm install -g pnpm
  ```
- **Git**: Para clonar el proyecto

### 🖥️ Compatibilidad del Sistema

> **AgenticForge** está diseñado para ser desplegado en **Linux** o **macOS**.  
> **Windows no es oficialmente compatible**.

---

## 🚀 Instalación de Producción

### 🤖 Instalación Ultra-Simple (100% Automática)

**Opción 1: Instalación en una línea**

```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**Opción 2: Instalación clásica**

```bash
# 1. Clonar el proyecto
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Instalación completamente automatizada
chmod +x run.sh
./run.sh install
```

**Opción 3: Instalación interactiva**

```bash
# 1. Clonar el proyecto
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Iniciar la consola de gestión de AgenticForge
chmod +x run.sh
./run.sh
```

**Consola de Gestión de Producción:**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & Servicios
    1) 🟢 Iniciar Servicios            5) 📊 Registros del Worker
    2) 🔄 Reiniciar Todo               6) 🐚 Shell del Contenedor
    3) 🔴 Detener Servicios              7) 🔨 Reconstruir Todo
    4) ⚡ Estado                    8) 🐳 Registros de Docker

    Pruebas & Calidad
    9) 🔬 Solo Pruebas Unitarias           12) 🔍 Lintear Código
   10) 🔗 Pruebas de Integración         13) ✨ Formatear Código
   11) 🧪 Todas las Pruebas                14) 📘 Verificación de Tipos

   15) 🚪 Salir
```

**Elija "1) 🟢 Iniciar Servicios" para instalación automática**

**🔧 En el primer inicio, el sistema:**

- Crea automáticamente el archivo `.env` con valores predeterminados
- Instala las dependencias pnpm necesarias
- Construye los paquetes core y UI
- Lanza todos los servicios Docker
- Configura el entorno de producción

## ⚙️ Configuración Rápida

### Configuración Inicial

En el primer inicio, el archivo `.env` se crea con valores predeterminados. Puede establecer su primera clave API allí para un inicio rápido.

```env
# === CONFIGURACIÓN DE AGENTIC FORGE ===

# Puertos de acceso
PUBLIC_PORT=8080          # API y servidor principal
WEB_PORT=3002            # Interfaz de usuario

# Base de datos y caché
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""        # Dejar vacío para uso local

# Inteligencia Artificial - Clave de inicio
LLM_API_KEY="su_clave_api_preferida"
LLM_PROVIDER="gemini"          # o "openai", "anthropic", "grok", etc.
LLM_MODEL_NAME="gemini-2.5-pro"   # Modelo correspondiente al proveedor
LLM_API_BASE_URL=""            # Opcional, se detecta automáticamente si no se proporciona

# Seguridad
AUTH_TOKEN="$(openssl rand -hex 32)"     # Generado automáticamente

# Entorno
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 Gestión de Claves API Múltiples mediante Interfaz Web

AgenticForge integra un poderoso **LlmKeyManager** para la gestión centralizada y dinámica de sus claves API, accesible directamente desde la interfaz web.

1.  **Acceder a la interfaz**: Abra su navegador en [http://localhost:3002](http://localhost:3002).
2.  **Ir a "Administrador de Claves LLM"**: Use el menú para navegar a la página de gestión de claves.

#### Funciones de LlmKeyManager:

- **Adición/Eliminación de Claves en Tiempo Real**: Agregue o elimine claves API para diferentes proveedores (OpenAI, Gemini, Anthropic, etc.) sin reiniciar el sistema.
- **Activación/Desactivación**: Active o desactive claves sobre la marcha.
- **Conmutación Automática**: Si una clave API falla (límite de solicitudes alcanzado, error), el sistema cambia automáticamente a la siguiente clave válida para garantizar la continuidad del servicio.
- **Monitoreo y Estadísticas**: Seguimiento del uso de sus claves, número de claves activas y número de proveedores configurados.
- **Pruebas de Validez**: Pruebe la validez de cada clave directamente desde la interfaz.

#### Agregar Claves Adicionales

1. **Mediante Interfaz Web**: [localhost:3002](http://localhost:3002) → Pestaña "Claves API"
2. **Funciones**:
   - ✅ Adición/eliminación de claves en tiempo real
   - ✅ Conmutación automática en caso de error
   - ✅ Monitoreo de rendimiento por clave
   - ✅ Desactivación temporal de claves defectuosas
   - ✅ Soporte multi-proveedor simultáneo

#### Jerarquía Automática

El sistema prueba las claves en orden de confiabilidad y cambia automáticamente si una clave falla.

---

## 🤖 Configuración de IA

### Opción 1: API en la Nube (Recomendado para comenzar)

| Proveedor     | Modelos Recomendados (2025)          | Obtener una Clave API                                     |
| ------------- | ------------------------------------ | --------------------------------------------------------- |
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys)   |
| **OpenAI**    | `gpt-5`, `gpt-4o`, `gpt-4.1`         | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet`   | [console.anthropic.com](https://console.anthropic.com/)   |
| **DeepSeek**  | `deepseek-v3`, `deepseek-r1`         | [platform.deepseek.com](https://platform.deepseek.com)    |

### Opción 2: IA Local (Para privacidad)

#### Ollama

1. **Instalar Ollama**: [ollama.ai](https://ollama.ai/)
2. **Descargar un modelo**:
   ```bash
   ollama pull deepseek-r1:14b  # Recomendado para la mayoría de tareas
   ollama serve
   ```

#### LM Studio

1. **Instalar LM Studio**: [lmstudio.ai](https://lmstudio.ai/)
2. **Descargar un modelo** e iniciar el servidor local
3. **Configuración**:
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # Cualquier valor
   LLM_MODEL_NAME="su-modelo-local"
   ```

**Nota**: El sistema detecta automáticamente los servidores locales

---

## 🚀 Gestión del Sistema

### Consola de Gestión Interactiva

```bash
# Acceder a todas las funciones mediante consola
./run.sh
```

### Comandos de Producción Rápidos

```bash
# Inicio completo
./run.sh start

# Verificar estado de servicios
./run.sh status

# Ver registros del sistema
./run.sh logs

# Reiniciar después de modificación de configuración
./run.sh restart

# Apagado limpio del sistema
./run.sh stop
```

### 🧪 Pruebas API Completas

AgenticForge incluye un conjunto completo de pruebas para validar las capacidades del agente mediante API:

```bash
# Interfaz de pruebas interactiva
./run-tests.sh

# Pruebas rápidas de lienzo y lista de tareas
./run-tests.sh canvas

# Pruebas completas de capacidades
./run-tests.sh full
```

**Tipos de pruebas disponibles:**

- ✅ **Lienzo y Lista de Tareas**: Creación y gestión de diagramas y listas de tareas
- ✅ **Herramientas MCP**: Creación y ejecución de herramientas personalizadas
- ✅ **Generación de Código**: TypeScript, Python y otros lenguajes
- ✅ **Planificación**: Descomposición y ejecución de tareas complejas
- ✅ **Gestión de Sesiones**: Historial y continuidad de conversaciones
- ✅ **Seguridad**: Manejo de errores y comandos peligrosos

**Todas las pruebas se guardan en `tests/agent-test-logs/` para análisis detallado.**

### 🔧 Control de Calidad del Código

Las herramientas de calidad de código (lint, TypeScript, formato) están integradas en la consola de gestión:

```bash
# Consola de gestión completa
./run.sh

# O directamente:
pnpm run lint      # Verificación de calidad de código
pnpm run typecheck # Verificación de tipos TypeScript
pnpm run format    # Formateo automático
```

---

## 🌐 Acceso a AgenticForge

### Interfaces Principales

| Interfaz            | URL                                     | Descripción                                       |
| ------------------- | --------------------------------------- | ------------------------------------------------- |
| **🎨 Interfaz Web** | [localhost:3002](http://localhost:3002) | Interfaz principal para interactuar con el agente |
| **🛠️ Servidor API** | [localhost:8080](http://localhost:8080) | API backend y servidor principal                  |

---

## 🎯 Casos de Uso y Ejemplos

### 🚀 Inicio Rápido

1. **Acceder** a [localhost:3002](http://localhost:3002)
2. **Probar** la forja de herramientas MCP en tiempo real:
   ```
   "Crea una herramienta MCP personalizada para analizar registros del sistema,
   códifica en TypeScript, integra al worker y pruébala inmediatamente"
   ```
3. **O probar** la ejecución directa del sistema:
   ```
   "Analiza mi sistema, crea una API REST en una nueva carpeta,
   instala dependencias con npm, ejecuta pruebas e inicia el servidor"
   ```

### 🔧 Forja de Herramientas MCP Personalizadas

#### ⚡ Herramientas Avanzadas del Sistema

```bash
"Forja una herramienta MCP que monitoree en tiempo real:
- Codifica la herramienta en TypeScript con esquemas Zod
- Intégrala directamente al worker de AgenticForge
- Interfaz para monitorear CPU/RAM/Procesos
- Visualización en tiempo real en la interfaz web
- Prueba inmediata de todas las funciones"
```

#### 🌐 Herramientas Web Inteligentes

```bash
"Crea una herramienta de scraping MCP inteligente:
- Genera código con gestión de sesiones
- Interfaz Playwright integrada al worker
- Esquemas de validación de datos scrapeados
- Panel de resultados en tiempo real
- Almacenamiento automático en base de datos local"
```

### 🌐 Aplicaciones Full-Stack

#### ⚙️ Automatización y Supervisión del Sistema

```bash
"Lee este archivo de configuración YAML, crea un daemon Python que:
- Monitoree procesos del sistema definidos
- Ejecute automáticamente tareas cron
- Envíe registros a /var/log/automation.log
- Reinicie servicios en caso de fallo
- Inicie el daemon con systemctl --user"
```

### 📊 Herramientas de Rendimiento

#### 🏃‍♂️ Benchmarking Completo del Sistema

```bash
"Ejecuta un benchmark completo de esta máquina:
- Prueba CPU/RAM/Disco con stress-ng
- Benchmark de red con iperf3 a 8.8.8.8
- Mide el rendimiento de mis APIs locales
- Genera informe HTML en ./benchmarks/
- Compara con resultados anteriores almacenados localmente"
```

#### 📚 Documentación Auto-Generada

``bash
"Escanea recursivamente mi proyecto, analiza el código fuente, genera:

- README.md detallado con diagramas de arquitectura
- Documentación API con Swagger/OpenAPI
- Diagramas de clases UML (con PlantUML)
- Guía de instalación probada en esta máquina
- Publica todo en un servidor local con docsify"

````

### 🔧 Gestión de Proyectos

#### 🌳 Flujos de Trabajo Git con Despliegue Automático

```bash
"Configura un flujo de trabajo Git completo en este repositorio:
- Instala y configura GitFlow con hooks
- Crea scripts pre-commit con pruebas automáticas
- Configura GitHub Actions o GitLab CI localmente
- Script de despliegue que construye, prueba y reinicia servicios
- Prueba el flujo de trabajo completo con una rama de características"
````

### 🎯 Proyectos Especializados

#### 🤖 Agente con Conjunto de Herramientas MCP Personalizado

```bash
"Clona AgenticForge, crea un agente especializado con sus propias herramientas MCP:
- Forja 5 herramientas MCP: monitoreo, despliegue, copia de seguridad, alertas, análisis
- Cada herramienta codificada en TypeScript con interfaces Zod completas
- Interfaz web en el puerto 3001 mostrando todas las herramientas en acción
- Base SQLite para persistencia + herramientas MCP para gestionarla
- Prueba completa del conjunto de herramientas forjadas automáticamente"
```

#### 💻 Administración de Sistemas Inteligente

```bash
"Analiza este servidor Linux y crea un panel de administración:
- Monitor en tiempo real: CPU, RAM, disco, red
- Gestión de servicios systemd con interfaz web
- Copia de seguridad automática de configuraciones importantes
- Alertas por correo/Slack en caso de problemas
- Scripts de mantenimiento programados
- Interfaz accesible mediante nginx en el puerto 8080"
```

**🔥 Poder Único**:

- **🛠️ Forja MCP**: Crea herramientas MCP personalizadas en TypeScript, las integra al worker y las prueba inmediatamente
- **⚡ Ejecución Directa**: Acceso completo al sistema - instalación, configuración, pruebas, despliegue automatizado
- **🎯 Transparencia Total**: Visualiza tus herramientas MCP forjadas en acción directamente en la interfaz web

---

### Gestión Avanzada del Sistema

| Acción                | Comando                    | Uso                                      |
| --------------------- | -------------------------- | ---------------------------------------- |
| **Consola Completa**  | `./run.sh`                 | Interfaz principal de gestión            |
| **Inicio Rápido**     | `./run.sh start`           | Lanzamiento directo del sistema          |
| **Monitoreo**         | `./run.sh status`          | Estado de servicios Docker               |
| **Registros en Vivo** | `./run.sh logs`            | Monitoreo en tiempo real                 |
| **Reiniciar**         | `./run.sh restart`         | Después de modificación de configuración |
| **Mantenimiento**     | `./run.sh` → Opciones 7-14 | Pruebas, lint, formato, reconstrucción   |

---

## ⚙️ Arquitectura de Producción

### Pila Técnica

- **🧠 Servidor Principal**: API REST, orquestación de IA, gestión de sesiones
- **🌐 Interfaz Web**: Aplicación React con streaming en tiempo real
- **💾 Redis**: Caché de alto rendimiento y broker de mensajes
- **🗄️ PostgreSQL**: Almacenamiento persistente de sesiones y herramientas
- **🐳 Docker Compose**: Orquestación completa de servicios
- **📊 OpenTelemetry**: Observabilidad y monitoreo

### Proceso de Forja de Herramientas

1. **Análisis** → IA entiende las necesidades del usuario
2. **Diseño** → Generación de código TypeScript/Python
3. **Validación** → Pruebas automáticas y verificación
4. **Integración** → Adición al catálogo de herramientas
5. **Ejecución** → Disponible instantáneamente en la interfaz

---

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulte el archivo `LICENSE` para obtener detalles.

---

## Agradecimientos

- **[FastMCP](https://github.com/punkpeye/fastmcp)**: Framework MCP de alto rendimiento - el cohete que impulsa AgenticForge 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**: Protocolo revolucionario para interacciones con LLMs
- **[Docker](https://docker.com)**: Contenerización y aislamiento
- **[Redis](https://redis.io)**: Estructuras de datos de alto rendimiento
- **[Playwright](https://playwright.dev)**: Automatización web moderna
- **Comunidad de Código Abierto**: Por la inspiración y colaboración

---

## Soporte

- **🚨 Problemas**: [GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 Discusiones**: [GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 Documentación**: [Wiki del Proyecto](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord**: [Únase a la comunidad](https://discord.gg/VNtXQByKfg) - _Comparta sus creaciones, obtenga ayuda en tiempo real y descubra las últimas novedades por adelantado_

---

<div align="center">

**🔨 Un herrero forja sus martillos.** **🤖 AgenticForge forja sus propias capacidades.**

_Forje su futuro tecnológico._

[![Comenzar](https://img.shields.io/badge/🚀_Comenzar-brightgreen?style=for-the-badge)](./run.sh)

</div>
