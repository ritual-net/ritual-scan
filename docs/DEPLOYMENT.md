#  Etherscan Clone - Deployment Guide

## 📋 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- Make (for using the Makefile commands)

###  Setup Environment
```bash
# Copy environment template and configure
make env-setup

# Edit your environment files
vi .env.local      # Development environment
vi .env.production # Production environment
```

### 🏃‍♂ Quick Commands

#### Development
```bash
make up            # Start development environment
make down          # Stop development environment
make restart       # Restart development environment
```

#### Production
```bash
make prod-up       # Start production environment
make prod-down     # Stop production environment
```

#### Docker Operations
```bash
make docker-build  # Build production Docker image
make docker-logs   # View container logs
make docker-health # Check container health
make size          # Show Docker image sizes
```

##  Architecture

### Multi-Stage Docker Build
- **deps**: Install production dependencies
- **builder**: Build the application with dev dependencies
- **prod-deps**: Clean production dependencies only
- **runner**: Final runtime image

### Docker Compose Profiles
- **dev**: Development with hot reload
- **prod**: Production with Nginx reverse proxy

##  Deployment Options

### 1. Local Docker
```bash
# Build and run production container
make docker-build
make docker-run

# Access at http://localhost:3000
```

### 2. Docker Compose Production
```bash
# Start full production stack
make prod-up

# Includes:
# - Next.js application
# - Nginx reverse proxy  
# - Redis cache (optional)
# - Health checks
```

### 3. Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml

# Features:
# - HorizontalPodAutoscaler
# - Health checks
# - Resource limits
# - Ingress with SSL
```

### 4. Cloud Platforms

#### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

#### Docker Registry
```bash
# Tag and push to registry
make docker-tag
make docker-push

# Pull and deploy
make docker-pull
```

##  Configuration

### Environment Variables

#### Required
```env
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_CHAIN=ethereum
```

#### API Keys
```env
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here
NEXT_PUBLIC_POLYGONSCAN_API_KEY=your_key_here
NEXT_PUBLIC_ARBISCAN_API_KEY=your_key_here
NEXT_PUBLIC_BASESCAN_API_KEY=your_key_here
```

#### Custom RETH Node
```env
NEXT_PUBLIC_RETH_RPC_URL=http://35.185.40.237:8545
NEXT_PUBLIC_RETH_WS_URL=ws://35.185.40.237:8546
NEXT_PUBLIC_RETH_BACKUP_RPC_URL=http://130.211.246.58:8545
```

#### Optional Services
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
NEXT_PUBLIC_INFURA_PROJECT_ID=your_project_id
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
```

### Chain Configuration
Add new chains in `src/lib/chains.ts`:

```typescript
mychain: {
  id: 12345,
  name: 'mychain',
  displayName: 'My Custom Chain',
  symbol: 'MCT',
  rpcUrls: ['https://rpc.mychain.com'],
  apiEndpoint: 'https://api.mychain.com',
  features: {
    eip1559: true,
    contractVerification: true,
    mempool: false,
    traces: true,
    logs: true,
  }
}
```

##  Monitoring & Health Checks

### Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-09-27T08:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "memory": {
    "used": 45.2,
    "total": 128.0,
    "external": 2.1
  },
  "checks": {
    "database": "ok",
    "external_apis": "ok"
  }
}
```

### Monitoring Commands
```bash
make docker-stats   # Container resource usage
make docker-logs    # Application logs
make security-scan  # Security vulnerability scan
make audit          # NPM security audit
```

## 🔐 Security

### Features
- Content Security Policy (CSP)
- Security headers (CSRF, XSS protection)
- Input validation with Zod schemas
- Rate limiting in Nginx
- Non-root container user

### Security Scan
```bash
# Requires trivy installation
make security-scan
```

##  CI/CD

### GitHub Actions
Automated pipeline includes:
- Testing and linting
- Docker build and push
- Security scanning
- Deployment to staging/production

### Workflow Triggers
- Push to `main` → Deploy to production
- Push to `develop` → Deploy to staging
- Pull requests → Run tests

##  Performance

### Optimizations
- Multi-stage Docker build
- Next.js standalone output
- Static asset caching
- Gzip compression
- Image optimization

### Build Metrics
- Build time: ~2-3 minutes
- Image size: ~200MB (compressed)
- Cold start: <2 seconds
- Memory usage: ~128MB

## 🛠 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Docker cache
make docker-clean

# Rebuild from scratch
make docker-build
```

#### Network Issues
```bash
# Check container network
docker network ls
docker network inspect etherscan-network
```

#### Permission Issues
```bash
# Fix file permissions
chmod +x scripts/*
sudo chown -R $USER:$USER .
```

### Debugging
```bash
# Access container shell
make docker-shell

# View detailed logs
docker logs -f etherscan-clone-container --tail 100

# Check container health
make docker-health
```

##  Updates & Rollbacks

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
make prod-down
make docker-build
make prod-up
```

### Rollback
```bash
# Stop current version
make prod-down

# Run previous image
docker run -d -p 3000:3000 etherscan-clone:previous-tag

# Or use Makefile rollback
make rollback
```

## 📞 Support

### Health Checks
- Application: `http://localhost:3000/api/health`
- Container: `docker health etherscan-clone-container`
- Nginx: `http://localhost/health`

### Logs
- Application: `make docker-logs`
- Nginx: `docker logs nginx-container`
- System: `docker stats`

### Resources
- GitHub Repository: [link]
- Documentation: [link]
- Issue Tracker: [link]

---

##  Deployment Checklist

- [ ] Environment variables configured
- [ ] API keys obtained and set
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Domain DNS configured
- [ ] Health checks passing
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Team access configured

---

Built with ❤ for production deployment
