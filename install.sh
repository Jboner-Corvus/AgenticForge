#!/bin/bash

# =============================================================================
# AgenticForge One-Line Installer
# =============================================================================
# Usage: curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
# =============================================================================

set -euo pipefail

# Colors for output
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly NC='\033[0m' # No Color

# Configuration
readonly REPO_URL="https://github.com/Jboner-Corvus/AgenticForge.git"
readonly INSTALL_DIR="${INSTALL_DIR:-$HOME/AgenticForge}"

# Banner
echo -e "${COLOR_ORANGE}"
echo '    ╔═══════════════════════════════════════════════════╗'
echo '    ║        AGENTICFORGE AUTOMATED INSTALLER          ║'
echo '    ╚═══════════════════════════════════════════════════╝'
echo -e "${NC}"

echo -e "${COLOR_CYAN}🚀 Installing AgenticForge to: ${COLOR_BLUE}$INSTALL_DIR${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo -e "${COLOR_RED}❌ This script should not be run as root${NC}"
    echo -e "${COLOR_YELLOW}💡 Please run as a regular user${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies on different systems
install_dependencies() {
    echo -e "${COLOR_BLUE}🔧 Checking and installing dependencies...${NC}"
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            echo -e "${COLOR_CYAN}📦 Detected Ubuntu/Debian system${NC}"
            sudo apt-get update -qq
            
            # Install Docker if not present
            if ! command_exists docker; then
                echo -e "${COLOR_YELLOW}🐳 Installing Docker...${NC}"
                curl -fsSL https://get.docker.com | sudo sh
                sudo usermod -aG docker "$USER"
                echo -e "${COLOR_GREEN}✅ Docker installed${NC}"
            fi
            
            # Install Node.js if not present
            if ! command_exists node; then
                echo -e "${COLOR_YELLOW}📦 Installing Node.js...${NC}"
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                sudo apt-get install -y nodejs
                echo -e "${COLOR_GREEN}✅ Node.js installed${NC}"
            fi
            
        elif command_exists yum; then
            # RHEL/CentOS
            echo -e "${COLOR_CYAN}📦 Detected RHEL/CentOS system${NC}"
            
            if ! command_exists docker; then
                echo -e "${COLOR_YELLOW}🐳 Installing Docker...${NC}"
                sudo yum install -y yum-utils
                sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                sudo yum install -y docker-ce docker-ce-cli containerd.io
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker "$USER"
                echo -e "${COLOR_GREEN}✅ Docker installed${NC}"
            fi
            
            if ! command_exists node; then
                echo -e "${COLOR_YELLOW}📦 Installing Node.js...${NC}"
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo yum install -y nodejs
                echo -e "${COLOR_GREEN}✅ Node.js installed${NC}"
            fi
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo -e "${COLOR_CYAN}📦 Detected macOS system${NC}"
        
        if ! command_exists brew; then
            echo -e "${COLOR_YELLOW}🍺 Installing Homebrew...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        if ! command_exists docker; then
            echo -e "${COLOR_YELLOW}🐳 Installing Docker Desktop...${NC}"
            brew install --cask docker
            echo -e "${COLOR_GREEN}✅ Docker Desktop installed${NC}"
            echo -e "${COLOR_YELLOW}⚠️ Please start Docker Desktop manually${NC}"
        fi
        
        if ! command_exists node; then
            echo -e "${COLOR_YELLOW}📦 Installing Node.js...${NC}"
            brew install node@20
            echo -e "${COLOR_GREEN}✅ Node.js installed${NC}"
        fi
    fi
    
    # Install pnpm
    if ! command_exists pnpm; then
        echo -e "${COLOR_YELLOW}📦 Installing pnpm...${NC}"
        npm install -g pnpm
        echo -e "${COLOR_GREEN}✅ pnpm installed${NC}"
    fi
    
    # Install Git if not present
    if ! command_exists git; then
        echo -e "${COLOR_YELLOW}📦 Installing Git...${NC}"
        if command_exists apt-get; then
            sudo apt-get install -y git
        elif command_exists yum; then
            sudo yum install -y git
        elif command_exists brew; then
            brew install git
        fi
        echo -e "${COLOR_GREEN}✅ Git installed${NC}"
    fi
}

# Function to clone repository
clone_repository() {
    echo -e "${COLOR_BLUE}📥 Cloning AgenticForge repository...${NC}"
    
    if [[ -d "$INSTALL_DIR" ]]; then
        echo -e "${COLOR_YELLOW}⚠️ Directory $INSTALL_DIR already exists${NC}"
        read -r -p "Remove and reinstall? (y/N): " remove_existing
        if [[ "$remove_existing" =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            echo -e "${COLOR_RED}❌ Installation cancelled${NC}"
            exit 1
        fi
    fi
    
    if ! git clone "$REPO_URL" "$INSTALL_DIR"; then
        echo -e "${COLOR_RED}❌ Failed to clone repository${NC}"
        exit 1
    fi
    
    cd "$INSTALL_DIR"
    echo -e "${COLOR_GREEN}✅ Repository cloned successfully${NC}"
}

# Function to run automated installation
run_installation() {
    echo -e "${COLOR_BLUE}🚀 Running automated installation...${NC}"
    
    # Make script executable
    chmod +x run-v2.sh
    
    # Run automated installation
    if ./run-v2.sh install; then
        echo -e "${COLOR_GREEN}✅ AgenticForge installed successfully!${NC}"
        echo ""
        echo -e "${COLOR_CYAN}🎉 Installation Complete!${NC}"
        echo ""
        echo -e "${COLOR_BLUE}📍 Access Points:${NC}"
        echo -e "   🌐 Web Interface: ${COLOR_GREEN}http://localhost:3002${NC}"
        echo -e "   🛠️ API Server: ${COLOR_GREEN}http://localhost:8080${NC}"
        echo ""
        echo -e "${COLOR_YELLOW}🔧 Management Commands:${NC}"
        echo -e "   cd $INSTALL_DIR"
        echo -e "   ./run-v2.sh status    # Check service status"
        echo -e "   ./run-v2.sh stop      # Stop all services"
        echo -e "   ./run-v2.sh restart   # Restart all services"
        echo -e "   ./run-v2.sh menu      # Interactive menu"
        echo ""
    else
        echo -e "${COLOR_RED}❌ Installation failed${NC}"
        echo -e "${COLOR_YELLOW}💡 Try running: cd $INSTALL_DIR && ./run-v2.sh setup${NC}"
        exit 1
    fi
}

# Main installation flow
main() {
    echo -e "${COLOR_CYAN}🔍 Checking system requirements...${NC}"
    
    # Install dependencies
    install_dependencies
    
    # Clone repository
    clone_repository
    
    # Run installation
    run_installation
    
    echo -e "${COLOR_GREEN}🎊 Welcome to AgenticForge!${NC}"
}

# Run main function
main "$@"