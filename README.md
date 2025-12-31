# Hextech File Hosting

A self-hosted CDN management panel with zero-trust security. Upload, organize, and serve files through your own infrastructure with Cloudflare protection.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Go](https://img.shields.io/badge/go-1.21-00ADD8.svg)
![React](https://img.shields.io/badge/react-18-61DAFB.svg)

## Features

- 📁 **File Management** — Upload, rename, move, delete files and folders
- 🔗 **Instant CDN URLs** — One-click copy public URLs for any file
- 📦 **Bulk Operations** — Multi-select with Ctrl+Click, Shift+Click, download as ZIP
- 📊 **Activity Logging** — Track all file operations with IP addresses
- 🔒 **Zero-Trust Security** — Cloudflare Access authentication
- 🎨 **Modern UI** — Dark/light themes with 6 accent color options
- 🐳 **Docker Ready** — Single command deployment

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                          │
├──────────────────────────────────────────────────────────────┤
│  Access Policy          │           CDN Caching              │
│  (Authentication)       │           (Optional)               │
└──────────┬───────────────┴──────────────┬────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────┐
│   Cloudflare Tunnel │      │   Cloudflare Tunnel │
│   panel.domain.com  │      │   cdn.domain.com    │
└──────────┬──────────┘      └──────────┬──────────┘
           │                            │
           ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐
│   Hextech Panel     │      │   Nginx (CDN)       │
│   (Go + React)      │─────▶│   Static Files      │
│   :8080             │      │   :80               │
└─────────────────────┘      └─────────────────────┘
```

## Quick Start

### Prerequisites

- Ubuntu Server (or any Docker-compatible system)
- Domain with Cloudflare DNS
- Cloudflare account (free tier works)

### One-Command Installation

```bash
curl -fsSL https://cdn.v1ggs.lol/install.sh -o install.sh && bash install.sh
```

The installer will:
1. Check/install Docker and Docker Compose
2. Prompt for your domains and Cloudflare tunnel token
3. Generate all configuration files
4. Pull and start all containers

For detailed setup instructions with screenshots, see the [Installation Walkthrough](docs/INSTALLATION_WALKTHROUGH.md).

### Manual Installation

```bash
# Create project directory
mkdir ~/hextech && cd ~/hextech
mkdir files

# Create configuration (copy from examples)
# Edit docker-compose.yml with your domains
docker compose up -d
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Internal server port |
| `PUBLIC_HOSTNAME` | `localhost` | CDN domain for public URLs |
| `CDN_PATH` | `/srv/cdn` | File storage path |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |
| `MAX_UPLOAD_SIZE` | `104857600` | Max upload size (100MB) |
| `DEV_MODE` | `false` | Skip Cloudflare auth (dev only) |

## Documentation

📖 **Full documentation available at:** [**hextech-app.v1ggs.lol**](https://hextech-app.v1ggs.lol)

- Installation walkthrough with screenshots
- Technical documentation & API reference
- Security implementation details
- Architecture deep-dive

## Maintenance

```bash
cd ~/hextech

# View logs
docker compose logs -f hextech

# Update to latest
docker compose pull && docker compose up -d

# Backup database
docker cp hextech-panel:/data/hextech.db ./backup.db

# Stop services
docker compose down
```

## Security

- **Cloudflare Access** — Zero-trust email authentication
- **CSRF Protection** — Token-based request validation
- **Path Traversal Prevention** — Secure file path handling
- **MIME Validation** — File content verification
- **Extension Blocking** — Prevents executable uploads
- **Security Headers** — XSS, clickjacking protection

For complete security implementation details, see the [official documentation](https://hextech-app.v1ggs.lol).

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Go 1.21, Chi router, SQLite |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui |
| Infrastructure | Docker, Nginx, Cloudflare Tunnel |

## License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">

### Built with ❤️ by v1ggs

[![Portfolio](https://img.shields.io/badge/Portfolio-v1ggs.lol-FF6B6B?style=for-the-badge&logo=safari&logoColor=white)](https://v1ggs.lol)
[![GitHub](https://img.shields.io/badge/GitHub-v1ggs--dev-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/v1ggs-dev)
[![X](https://img.shields.io/badge/X-@v1ggs__-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/v1ggs_)
[![Email](https://img.shields.io/badge/Email-v1ggs.tech@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:v1ggs.tech@gmail.com)

```
╔═══════════════════════════════════════════════════════════╗
║  If you found this useful, consider giving it a ⭐!       ║
╚═══════════════════════════════════════════════════════════╝
```

</div>
