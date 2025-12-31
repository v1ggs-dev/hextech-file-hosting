#!/bin/bash

# ============================================
# Hextech File Hosting - Installation Script
# ============================================
# Usage: curl -fsSL https://cdn.v1ggs.lol/install.sh -o install.sh && bash install.sh
# Author: v1ggs (https://v1ggs.lol)
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Check if running interactively
if [ ! -t 0 ]; then
    echo -e "${RED}ERROR: This script requires interactive input.${NC}"
    echo ""
    echo "Please run it like this instead:"
    echo -e "${GREEN}  curl -fsSL https://cdn.v1ggs.lol/install.sh -o install.sh && bash install.sh${NC}"
    echo ""
    exit 1
fi

# Print banner
echo -e "${PURPLE}"
cat << 'BANNER'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██╗  ██╗███████╗██╗  ██╗████████╗███████╗ ██████╗██╗  ██╗       ║
║   ██║  ██║██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝██╔════╝██║  ██║       ║
║   ███████║█████╗   ╚███╔╝    ██║   █████╗  ██║     ███████║       ║
║   ██╔══██║██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║     ██╔══██║       ║
║   ██║  ██║███████╗██╔╝ ██╗   ██║   ███████╗╚██████╗██║  ██║       ║
║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝       ║
║                                                                   ║
║                 File Hosting Installation Script                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

echo -e "${CYAN}Welcome to the Hextech File Hosting installer!${NC}"
echo -e "${GRAY}Made by v1ggs • https://v1ggs.lol${NC}"
echo ""

# ============================================
# Step 1: Check/Install Dependencies
# ============================================
echo -e "${YELLOW}[1/5] Checking dependencies...${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | $SUDO sh
    $SUDO usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
    echo -e "${YELLOW}Note: You may need to log out and back in for docker group to take effect${NC}"
else
    echo -e "${GREEN}✓ Docker is already installed${NC}"
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${BLUE}Docker Compose not found. Installing...${NC}"
    $SUDO apt-get update
    $SUDO apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✓ Docker Compose is already installed${NC}"
fi

echo ""

# ============================================
# Step 2: Get Installation Directory
# ============================================
echo -e "${YELLOW}[2/5] Installation Directory${NC}"
echo ""

DEFAULT_INSTALL_DIR="$HOME/hextech"
echo -e "${CYAN}Where would you like to install Hextech?${NC}"
echo -e "${GRAY}Press Enter to use default: ${DEFAULT_INSTALL_DIR}${NC}"
read -p "Installation directory: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"

# Create directory
mkdir -p "$INSTALL_DIR/files"
cd "$INSTALL_DIR"

echo -e "${GREEN}✓ Created directory: $INSTALL_DIR${NC}"
echo ""

# ============================================
# Step 3: Get User Configuration
# ============================================
echo -e "${YELLOW}[3/5] Configuration${NC}"
echo ""

# Port
echo -e "${CYAN}Panel Internal Port${NC}"
echo -e "${GRAY}The port Hextech will run on internally. Default: 8080${NC}"
read -p "Port [8080]: " PORT
PORT="${PORT:-8080}"
echo ""

# Panel domain
echo -e "${CYAN}Panel Domain${NC}"
echo -e "${GRAY}This is where you'll access the dashboard to manage your files.${NC}"
echo -e "${GRAY}Example: panel.yourdomain.com or files.yourdomain.com${NC}"
read -p "Panel domain: " PANEL_DOMAIN
while [ -z "$PANEL_DOMAIN" ]; do
    echo -e "${RED}Panel domain is required!${NC}"
    read -p "Panel domain: " PANEL_DOMAIN
done
echo ""

# CDN domain
echo -e "${CYAN}CDN Domain${NC}"
echo -e "${GRAY}This is where your uploaded files will be publicly accessible.${NC}"
echo -e "${GRAY}Example: cdn.yourdomain.com or static.yourdomain.com${NC}"
read -p "CDN domain: " CDN_DOMAIN
while [ -z "$CDN_DOMAIN" ]; do
    echo -e "${RED}CDN domain is required!${NC}"
    read -p "CDN domain: " CDN_DOMAIN
done
echo ""

# Cloudflare Tunnel Token
echo -e "${CYAN}Cloudflare Tunnel Token${NC}"
echo ""
echo -e "${GRAY}To get your tunnel token:${NC}"
echo -e "${GRAY}1. Go to ${BLUE}https://dash.cloudflare.com${GRAY} and login${NC}"
echo -e "${GRAY}2. Navigate to ${BLUE}Zero Trust${GRAY} (left sidebar)${NC}"
echo -e "${GRAY}3. Go to ${BLUE}Networks → Connectors${NC}"
echo -e "${GRAY}4. Select your tunnel (or create one)${NC}"
echo -e "${GRAY}5. Click ${BLUE}Configure${GRAY}, then copy any install command${NC}"
echo ""
echo -e "${YELLOW}Tip: You can paste the entire command - we'll extract the token automatically!${NC}"
echo -e "${GRAY}Example: cloudflared.exe service install eyJhIjo... or just the token itself${NC}"
echo ""
read -p "Paste tunnel token or install command: " TUNNEL_INPUT

while [ -z "$TUNNEL_INPUT" ]; do
    echo -e "${RED}Tunnel token is required!${NC}"
    read -p "Paste tunnel token or install command: " TUNNEL_INPUT
done

# Extract token from input (handles all Cloudflare command formats)
# Token always starts with 'eyJ' (base64 encoded JSON)
TUNNEL_TOKEN=$(echo "$TUNNEL_INPUT" | grep -oE 'eyJ[A-Za-z0-9_-]+' | head -1)

if [ -z "$TUNNEL_TOKEN" ]; then
    echo -e "${RED}Could not extract token. Please paste just the token (starts with eyJ...).${NC}"
    read -p "Token: " TUNNEL_TOKEN
    while [ -z "$TUNNEL_TOKEN" ]; do
        echo -e "${RED}Tunnel token is required!${NC}"
        read -p "Token: " TUNNEL_TOKEN
    done
fi

echo -e "${GREEN}✓ Token extracted successfully${NC}"
echo ""

# ============================================
# Step 4: Create Configuration Files
# ============================================
echo -e "${YELLOW}[4/5] Creating configuration files...${NC}"

# Create .env file
cat > .env << ENVEOF
TUNNEL_TOKEN=$TUNNEL_TOKEN
ENVEOF
echo -e "${GREEN}✓ Created .env${NC}"

# Create nginx.conf
cat > nginx.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    autoindex off;

    location / {
        limit_except GET HEAD { deny all; }
        try_files $uri =404;
        expires 5m;
        add_header Cache-Control "public, max-age=300, must-revalidate";
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
    }

    # Block executable/script files
    location ~* \.(php|phtml|phar|cgi|pl|py|sh|exe|dll|so|bin|bat|cmd|ps1)$ {
        deny all;
        return 404;
    }

    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
NGINXEOF
echo -e "${GREEN}✓ Created nginx.conf${NC}"

# Create docker-compose.yml
cat > docker-compose.yml << COMPOSEEOF
services:
  # Hextech Control Panel
  hextech:
    image: ghcr.io/v1ggs-dev/hextech-file-hosting:latest
    container_name: hextech-panel
    restart: unless-stopped
    environment:
      - PORT=$PORT
      - ALLOWED_ORIGINS=https://$PANEL_DOMAIN
      - PUBLIC_HOSTNAME=$CDN_DOMAIN
      - CDN_PATH=/srv/cdn
    volumes:
      - hextech-data:/data
      - $INSTALL_DIR/files:/srv/cdn
    networks:
      - hextech-network

  # CDN File Server (nginx)
  cdn:
    image: nginx:alpine
    container_name: hextech-cdn
    restart: unless-stopped
    volumes:
      - $INSTALL_DIR/files:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - hextech-network

  # Cloudflare Tunnel
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: hextech-tunnel
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=\${TUNNEL_TOKEN}
    networks:
      - hextech-network
    depends_on:
      - hextech
      - cdn

volumes:
  hextech-data:

networks:
  hextech-network:
COMPOSEEOF
echo -e "${GREEN}✓ Created docker-compose.yml${NC}"

echo ""

# ============================================
# Step 5: Pull and Start Containers
# ============================================
echo -e "${YELLOW}[5/5] Starting Hextech...${NC}"
echo ""
echo -e "${GRAY}Pulling Docker images (this may take a minute)...${NC}"
docker compose pull

echo ""
docker compose up -d

echo ""

# ============================================
# Success & Next Steps
# ============================================
echo -e "${GREEN}"
cat << 'SUCCESS'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              ✓ Hextech installed successfully!                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
SUCCESS
echo -e "${NC}"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}NEXT STEPS: Configure Cloudflare Tunnel Routes${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GRAY}You should already have the Cloudflare Tunnel page open.${NC}"
echo -e "${GRAY}Go to the ${BLUE}Published application routes${GRAY} tab and click ${BLUE}Add a published application route${NC}"
echo ""
echo -e "${YELLOW}Route 1: Panel Dashboard${NC}"
echo -e "  Hostname:     ${GREEN}$PANEL_DOMAIN${NC}"
echo -e "  Service Type:  ${GREEN}HTTP${NC}"
echo -e "  URL:           ${GREEN}hextech:$PORT${NC}"
echo -e "  ${GRAY}→ Click Save${NC}"
echo ""
echo -e "${YELLOW}Route 2: CDN File Server${NC}"
echo -e "  Hostname:     ${GREEN}$CDN_DOMAIN${NC}"
echo -e "  Service Type:  ${GREEN}HTTP${NC}"
echo -e "  URL:           ${GREEN}cdn:80${NC}"
echo -e "  ${GRAY}→ Click Save${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}NEXT STEPS: Set Up Cloudflare Access (Authentication)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GRAY}1. In Zero Trust, go to ${BLUE}Access controls → Applications${NC}"
echo -e "${GRAY}2. Click ${BLUE}Select your application → Self-hosted${NC}"
echo -e "${GRAY}3. Set domain to: ${GREEN}$PANEL_DOMAIN${NC}"
echo -e "${GRAY}4. Select a policy${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Information${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GRAY}Installation directory:${NC}  $INSTALL_DIR"
echo -e "  ${GRAY}Files stored in:${NC}         $INSTALL_DIR/files"
echo -e "  ${GRAY}Dashboard URL:${NC}           ${GREEN}https://$PANEL_DOMAIN${NC}"
echo -e "  ${GRAY}CDN URL:${NC}                 ${GREEN}https://$CDN_DOMAIN${NC}"
echo ""
echo -e "  ${YELLOW}Manage services:${NC}"
echo -e "    cd $INSTALL_DIR"
echo -e "    docker compose ps        ${GRAY}# Check status${NC}"
echo -e "    docker compose logs -f   ${GRAY}# View logs${NC}"
echo -e "    docker compose down      ${GRAY}# Stop services${NC}"
echo -e "    docker compose pull && docker compose up -d  ${GRAY}# Update${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Happy hosting! 🚀${NC}"
echo ""
echo -e "${GRAY}─────────────────────────────────────────────────────────────────────${NC}"
echo -e "${GRAY}Hextech File Hosting • Made with ❤️ by v1ggs${NC}"
echo -e "${GRAY}Portfolio: ${BLUE}https://v1ggs.lol${NC}"
echo -e "${GRAY}─────────────────────────────────────────────────────────────────────${NC}"
