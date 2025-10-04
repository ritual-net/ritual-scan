# Ritual Scan

A blockchain explorer for Ritual Chain with support for async transactions, scheduled jobs, and real-time updates.

![Ritual Scan](https://img.shields.io/badge/Ritual-Scan-84cc16?style=for-the-badge&logo=blockchain&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)
![Real-time](https://img.shields.io/badge/WebSocket-Real--time-84cc16?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## Features

**Ritual Chain Support**
- Async transaction flow visualization
- Scheduled transaction monitoring  
- System account recognition (0x...fa7e, fa8e, fa9e)
- Transaction types: Legacy, EIP-1559, Scheduled, AsyncCommitment, AsyncSettlement
- Search by Call ID, origin transaction, or precompile address

**Real-Time Updates**
- WebSocket connection to RETH nodes with smart caching
- Instant page navigation with 0ms load times
- Live mempool monitoring
- Connection status indicators with auto-reconnection

**Performance**
- Smart caching system for instant navigation
- Real-time validator statistics
- Progressive data loading
- Mobile-responsive design

## Quick Start

```bash
git clone https://github.com/ritual-net/ritual-scan.git
cd ritual-scan
npm install
cp .env.example .env.local
# Edit .env.local with your RPC endpoints
npm run dev
```

Visit `http://localhost:3000` to see the explorer.

## Documentation

- [Environment Setup](./docs/environment.md) - Configuration options
- [Deployment](./docs/DEPLOYMENT.md) - Production deployment guide

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript
- Styling: Tailwind CSS, Radix UI components  
- Real-time: WebSocket connections, smart caching
- State: Zustand, React Query
- Charts: Plotly.js for data visualization
- Testing: Playwright end-to-end tests
- Deployment: Docker, Kubernetes, Vercel

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for development setup and guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test
4. Commit using conventional commits: `git commit -m "feat: add feature"`
5. Push to your branch: `git push origin feature/your-feature`
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
