# Ritual Explorer

![Ritual Explorer](https://img.shields.io/badge/Ritual-Explorer-84cc16?style=for-the-badge&logo=blockchain&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)
![Real-time](https://img.shields.io/badge/WebSocket-Real--time-84cc16?style=for-the-badge)

A blockchain explorer for **Ritual Chain** that supports async transactions, scheduled jobs, and real-time updates.

## Key Features

**Ritual Chain Support**
- Async transaction flow visualization
- Scheduled transaction monitoring  
- System account recognition (0x...fa7e, fa8e, fa9e)
- Transaction types: Legacy, EIP-1559, Scheduled, AsyncCommitment, AsyncSettlement
- Search by Call ID, origin transaction, or precompile address

**Real-Time Updates**
- WebSocket connection to RETH nodes
- Mempool updates every 2 seconds
- Connection status indicators

**Analytics**
- Transaction type distribution
- Protocol fee analysis
- System vs user transaction metrics

## 🖼 Screenshots


### Async Settlement Transaction (Type 0x12)

![Async Settlement Transaction (Type 0x12)](./docs/screenshots/tx-async-settlement.png)

Final settlement transaction with fee distribution in Ritual Chain async execution


### EIP-1559 Transaction (Type 0x2)

![EIP-1559 Transaction (Type 0x2)](./docs/screenshots/tx-eip1559.png)

Modern EIP-1559 transaction with priority fee and base fee mechanism


### Scheduled Transaction (Type 0x10)

![Scheduled Transaction (Type 0x10)](./docs/screenshots/tx-scheduled.png)

Ritual Chain scheduled transaction with Call ID tracking and cron-like execution


##  Architecture

### **Frontend Stack**
- **Next.js 14** with App Router and React Server Components
- **TypeScript** for complete type safety
- **Tailwind CSS** with lime/black Ritual theme
- **Real-time WebSocket** manager for live updates

### **Blockchain Integration**
- **Enhanced RETHClient** with Ritual-specific RPC methods
- **Multi-node Support** with fallback mechanisms  
- **Transaction Type Detection** for all 5 Ritual transaction types
- **System Account Recognition** and special handling

### **Real-Time Features**
- **WebSocket Manager** with automatic reconnection
- **React Hooks** for easy real-time integration
- **Update Throttling** and type filtering
- **Connection Status Monitoring**

##  Getting Started

### Prerequisites
- Node.js 18+ 
- Docker (optional)
- Access to Ritual Chain RETH nodes

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ritual-explorer

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Docker Deployment

```bash
# Build and run with Docker
docker build -t ritual-explorer .
docker run -d -p 9000:3000 --name ritual-explorer ritual-explorer
```

##  Configuration

### Environment Variables

```env
# RPC Configuration
NEXT_PUBLIC_RPC_URL=http://35.185.40.237:8545
NEXT_PUBLIC_WS_URL=ws://35.185.40.237:8546

# Network Configuration  
NEXT_PUBLIC_NETWORK_NAME=Shrinenet
NEXT_PUBLIC_CURRENCY_SYMBOL=RITUAL
```

### Real-Time WebSocket

The explorer automatically connects to RETH WebSocket endpoints for:
- New block headers (`eth_subscribe` → `newHeads`)
- Pending transactions (`eth_subscribe` → `newPendingTransactions`)  
- Mempool updates (high-frequency polling)
- Scheduled transaction monitoring

##  Ritual Chain Features

### **Transaction Types Supported**

| Type | Description | System Account | Features |
|------|-------------|----------------|----------|
| 0x0 | Legacy | N/A | Standard Ethereum transactions |
| 0x2 | EIP-1559 | N/A | Enhanced gas mechanism |
| 0x10 | Scheduled | 0x...fa7e | Cron-like execution, Call ID tracking |
| 0x11 | AsyncCommitment | 0x...fa8e | TEE execution commitment |
| 0x12 | AsyncSettlement | 0x...fa9e | Final settlement with fee distribution |

### **Enhanced Search Patterns**

- `callId:10567` - Search scheduled transactions by Call ID
- `origin:0x...` - Find transactions by origin hash
- `10567` - Numeric Call ID search
- System account detection (fa7e, fa8e, fa9e)
- Precompile addresses (0x...0801, etc.)

##  Pages & Features

### **Core Pages**
- **Homepage** - Network overview, latest blocks/transactions, stats
- **Blocks** - Real-time block explorer with detailed views  
- **Transactions** - Live transaction feed with type filtering
- **Mempool** - Real-time mempool monitoring with WebSocket updates

### **Ritual-Specific Pages**  
- **Scheduled** - Scheduled transaction pool with Call ID filtering
- **Ritual Analytics** - Advanced Ritual Chain metrics and adoption
- **Transaction Details** - Enhanced with async flow visualization
- **System Accounts** - Special pages for Ritual system addresses

##  Live Demo

**Production URL:** [Browser Preview Available](http://127.0.0.1:63901)

**Real-Time Features:**
-  WebSocket connection to RETH nodes
-  Live mempool updates every 2 seconds  
-  New block notifications
-  Scheduled transaction monitoring
-  Connection status indicators

## 🛠 Development

### **Project Structure**

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── blocks/            # Block explorer
│   ├── transactions/      # Transaction explorer  
│   ├── mempool/           # Real-time mempool
│   ├── scheduled/         # Scheduled transactions
│   ├── ritual-analytics/  # Ritual analytics
│   └── tx/[txHash]/       # Transaction details
├── components/            # Reusable components
│   ├── AsyncTransactionFlow.tsx    # Async flow visualization
│   ├── TransactionTypeBadge.tsx    # Type indicators
│   └── EnhancedTransactionDetails.tsx  # Enhanced details
├── hooks/                 # React hooks
│   └── useRealtime.ts     # Real-time WebSocket hooks
├── lib/                   # Core libraries
│   ├── reth-client.ts     # Enhanced RETHClient
│   └── realtime-websocket.ts  # WebSocket manager
└── styles/               # Tailwind CSS configuration
```

### **Key Components**

- **RETHClient** - Enhanced with Ritual-specific RPC methods
- **WebSocket Manager** - High-performance real-time updates
- **Transaction Flow** - Async relationship visualization  
- **System Recognition** - Ritual system account handling
- **Search Enhancement** - Call ID and precompile search

##  Testing

### **Automated Testing**

```bash
# Run component tests
npm test

# Generate screenshots  
npm run screenshots

# Test navigation flows
node test-navigation.js
```

### **Real-Time Testing**

The explorer includes extensive real-time testing:
- WebSocket connection monitoring
- Transaction type detection
- System account recognition  
- Async flow visualization
- Call ID search functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤ for the Ritual Network ecosystem</strong>
</div>
