# Ritual Explorer - System Design Document

##  Architecture Overview

The Ritual Explorer is a blockchain explorer for Ritual Chain that supports async execution, scheduled transactions, and system account management.

### Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js 14)  │◄──►│   (RPC/WS)      │◄──►│   (RETH Nodes)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Real-time WS    │    │ Enhanced RPC    │    │ Ritual Chain    │
│ Manager         │    │ Methods         │    │ Features        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

##  System Components

### 1. Frontend Architecture (Next.js 14)

#### App Router Structure
```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Homepage dashboard  
├── blocks/
│   └── page.tsx          # Block explorer
├── transactions/
│   └── page.tsx          # Transaction list
├── mempool/
│   └── page.tsx          # Real-time mempool
├── scheduled/
│   └── page.tsx          # Ritual scheduled transactions
├── ritual-analytics/
│   └── page.tsx          # Advanced Ritual analytics
├── tx/[txHash]/
│   └── page.tsx          # Enhanced transaction details
└── api/
    └── health/
        └── route.ts      # Health check endpoint
```

#### Component Architecture
```typescript
// Core Components
components/
├── AsyncTransactionFlow.tsx    # Async flow visualization
├── TransactionTypeBadge.tsx    # Type indicators
├── SystemAccountBadge.tsx      # System account recognition
├── EnhancedTransactionDetails.tsx  # Ritual transaction details
└── SearchBar.tsx              # Search with Call ID support

// Hooks  
hooks/
├── useRealtime.ts             # WebSocket real-time hooks
├── useBlockUpdates.ts         # Block-specific updates
├── useTransactionUpdates.ts   # Transaction-specific updates
└── useMempoolUpdates.ts       # Mempool-specific updates

// Core Libraries
lib/
├── reth-client.ts             # RETHClient with Ritual support
└── realtime-websocket.ts      # WebSocket manager
```

### 2. RETHClient System

#### Core RPC Integration
```typescript
class RETHClient {
  private rpcUrls: string[]     # Multi-node support
  private wsUrl: string         # WebSocket endpoint  
  private currentNodeIndex: number  # Failover tracking

  // Standard Methods
  async getBlock(blockNumber: string): Promise<Block>
  async getTransaction(hash: string): Promise<Transaction>
  async getTransactionReceipt(hash: string): Promise<Receipt>
  
  // Ritual-Specific Methods  
  async getEnhancedTransaction(hash: string): Promise<EnhancedTransaction>
  async getScheduledTransactions(): Promise<ScheduledTransaction[]>
  async getAsyncCommitments(): Promise<AsyncCommitment[]>
  
  // Utility Methods
  isSystemAccount(address: string): boolean
  getTransactionTypeLabel(type: string): string  
  getSystemAccountLabel(address: string): string
}
```

#### Node Failover Strategy
```typescript
interface NodeConfig {
  url: string
  priority: number
  healthStatus: 'healthy' | 'degraded' | 'down'
  lastCheck: number
  responseTime: number
}

// Multi-node architecture with automatic failover
Primary Node:   http://35.185.40.237:8545  (Primary)
Fallback Node:  http://130.211.246.58:8545  (Secondary)  
WebSocket:      ws://35.185.40.237:8546     (Real-time)
```

### 3. Real-Time WebSocket System

#### WebSocket Manager Architecture
```typescript
class RealtimeWebSocketManager {
  private ws: WebSocket | null
  private callbacks: Map<string, UpdateCallback>
  private reconnectAttempts: number
  private connectionId: string
  private highFrequencyPolling: NodeJS.Timeout[]

  // Connection Management
  startConnection(): void
  scheduleReconnect(): void  
  handleWebSocketMessage(message: any): void
  
  // Subscription Management
  subscribe(callbackId: string, callback: UpdateCallback): () => void
  notifyCallbacks(update: RealtimeUpdate): void
  
  // High-Performance Polling
  startHighFrequencyPolling(): void  // 2s mempool, 5s blocks
  forceRefresh(type: 'mempool' | 'scheduled' | 'blocks'): void
}
```

#### Update Flow Architecture
```
WebSocket Events → Manager → React Hooks → Components → UI Updates
      ↓              ↓           ↓            ↓           ↓
1. New Block    → Parse     → useBlockUpdates → Homepage → Live Stats
2. New Tx       → Filter    → useTransactionUpdates → Mempool → Live Feed  
3. Mempool      → Throttle  → useMempoolUpdates → Stats → Real-time Cards
4. Scheduled    → Process   → useScheduledUpdates → Pool → Job Monitoring
```

### 4. Ritual Chain Integration

#### Transaction Type System
```typescript
enum RitualTransactionType {
  LEGACY = '0x0',              # Standard Ethereum transactions
  EIP1559 = '0x2',             # Enhanced gas mechanism
  SCHEDULED = '0x10',          # Cron-like scheduled execution
  ASYNC_COMMITMENT = '0x11',   # TEE execution commitment  
  ASYNC_SETTLEMENT = '0x12'    # Final settlement with fees
}

const RITUAL_SYSTEM_ACCOUNTS = {
  SCHEDULED: '0x000000000000000000000000000000000000fa7e',
  ASYNC_COMMITMENT: '0x000000000000000000000000000000000000fa8e', 
  ASYNC_SETTLEMENT: '0x000000000000000000000000000000000000fa9e'
}
```

#### Enhanced Transaction Schema
```typescript
interface EnhancedTransaction {
  // Standard Fields
  type: string
  hash: string  
  blockNumber: string
  from: string
  to?: string
  value: string
  gas: string
  gasPrice: string
  
  // Ritual-Specific Fields
  spcCalls?: SpcCall[]         # Async precompile calls
  commitmentTx?: string        # Related commitment transaction
  settlementTx?: string        # Related settlement transaction
  originTx?: string           # Original user transaction
  callId?: number             # Scheduled job identifier
  index?: number              # Execution index for scheduled jobs
  frequency?: number          # Execution frequency in blocks
  precompileAddress?: string  # Async precompile contract
  executorAddress?: string    # TEE executor node
  totalAmount?: string        # Settlement total amount
  executorFee?: string        # Executor compensation
  commitmentFee?: string      # Commitment validation fee
}
```

##  Performance Architecture

### 1. Real-Time Performance Strategy

#### WebSocket Performance
```typescript
// High-Performance Configuration
const WEBSOCKET_CONFIG = {
  reconnectInterval: 1000,      // Start with 1s
  maxReconnectInterval: 30000,  // Max 30s
  maxReconnectAttempts: 10,     // Give up after 10 tries
  exponentialBackoff: true,     // Prevent thundering herd
  jitterRange: 1000            // Add randomness to reconnects
}

// Update Throttling
const THROTTLE_CONFIG = {
  blockUpdates: 0,             // No throttling - critical data
  transactionUpdates: 100,     // 100ms throttle for UI smoothness  
  mempoolUpdates: 1000,        // 1s throttle for efficiency
  scheduledUpdates: 2000       // 2s throttle for scheduled jobs
}
```

#### Polling Strategy
```typescript
// Multi-frequency polling for resilience
const POLLING_INTERVALS = {
  mempoolHighFreq: 2000,       // 2s for mempool data
  blockBackup: 5000,           // 5s backup block polling
  scheduledJobs: 10000,        // 10s for scheduled job pool
  healthCheck: 30000           // 30s for node health
}
```

### 2. Frontend Performance Optimization

#### Code Splitting Strategy
```typescript
// Route-based splitting
const ScheduledPage = dynamic(() => import('./scheduled/page'))
const RitualAnalytics = dynamic(() => import('./ritual-analytics/page'))
const TransactionFlow = dynamic(() => import('../components/AsyncTransactionFlow'))

// Feature-based splitting  
const RealtimeWebSocket = dynamic(() => import('../lib/realtime-websocket'))
const EnhancedSearch = dynamic(() => import('../components/SearchBar'))
```

#### Caching Architecture
```typescript
// Browser Caching
const CACHE_CONFIG = {
  staticAssets: '1 year',      // Immutable assets
  apiResponses: '5 minutes',   # Blockchain data
  realtimeData: '0',          # Never cache live data
  screenshots: '1 day'        # Documentation images
}

// Memory Management
const MEMORY_LIMITS = {
  transactionHashes: 1000,    # LRU cache for seen transactions
  blockHeaders: 100,          # Recent block headers
  searchResults: 50,          # Recent search queries
  websocketBuffer: 500        # WebSocket message buffer
}
```

## 🔒 Security & Reliability

### 1. Input Validation & Sanitization

#### Search Input Validation
```typescript
// Secure input patterns
const SEARCH_PATTERNS = {
  transactionHash: /^0x[a-fA-F0-9]{64}$/,
  blockNumber: /^\d+$/,  
  address: /^0x[a-fA-F0-9]{40}$/,
  callId: /^callid:(\d+)$/i,
  originTx: /^origin:0x[a-fA-F0-9]{64}$/i
}

// Sanitization pipeline
function sanitizeInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\x:.-]/g, '') // Remove dangerous characters
    .slice(0, 100)              // Limit length
}
```

#### RPC Security
```typescript
// Request validation
interface SecureRPCRequest {
  method: string              # Whitelist of allowed methods
  params: unknown[]          # Validated parameters
  timeout: number            # Request timeout
  retries: number            # Max retry attempts
}

// Method whitelist
const ALLOWED_RPC_METHODS = [
  'eth_getBlockByNumber',
  'eth_getBlockByHash', 
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_subscribe',
  'txpool_content',
  'txpool_status',
  'txpool_scheduledContent'  # Ritual-specific
]
```

### 2. Error Handling & Resilience

#### Error Classification System
```typescript
enum ErrorType {
  NETWORK_ERROR = 'network',       # Connection issues
  RPC_ERROR = 'rpc',              # Blockchain RPC errors  
  WEBSOCKET_ERROR = 'websocket',   # Real-time connection errors
  PARSE_ERROR = 'parse',          # Data parsing errors
  VALIDATION_ERROR = 'validation', # Input validation errors
  TIMEOUT_ERROR = 'timeout'       # Request timeout errors
}

interface ErrorHandling {
  retry: boolean              # Whether to retry the operation
  fallback: string | null     # Fallback data source
  userMessage: string         # User-friendly error message  
  logLevel: 'info' | 'warn' | 'error'
}
```

#### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failureCount: number = 0
  private lastFailureTime: number = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
}
```

### 3. Monitoring & Observability

#### Performance Metrics
```typescript
interface PerformanceMetrics {
  // WebSocket Metrics
  connectionUptime: number          # Connection stability
  reconnectionCount: number        # Reconnection frequency  
  messageLatency: number           # Real-time update delay
  subscriberCount: number          # Active connections
  
  // RPC Metrics
  requestLatency: number           # API response times
  errorRate: number               # Request error percentage
  nodeHealthStatus: string        # Node availability
  failoverCount: number           # Node failover events
  
  // UI Metrics  
  pageLoadTime: number            # Initial page load
  timeToInteractive: number       # User interaction ready
  realtimeUpdateDelay: number     # UI update latency
}
```

#### Logging Strategy
```typescript
// Structured logging
interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  component: string               # Component identifier
  connectionId?: string           # WebSocket connection ID
  userId?: string                # User session ID
  action: string                 # Action being performed
  duration?: number              # Operation duration
  error?: string                 # Error message if applicable
}

// Log levels by environment
const LOG_CONFIG = {
  development: ['error', 'warn', 'info'],
  production: ['error', 'warn'],
  testing: ['error']
}
```

##  Data Flow Architecture  

### 1. Real-Time Data Pipeline

```
Ritual Chain → RETH Nodes → WebSocket → Frontend → UI Components
     ↓             ↓            ↓          ↓           ↓
1. New Block   → Parse      → Manager   → Hook     → Live Update
2. New Tx      → Filter     → Throttle  → State    → Visual Change  
3. Mempool     → Transform  → Cache     → Render   → User Sees
4. Scheduled   → Validate   → Store     → Display  → Real-time UI
```

### 2. Search & Navigation Flow

```
User Input → Validation → Pattern Match → RPC Request → Results → Display
    ↓           ↓            ↓             ↓            ↓         ↓
1. "10567"  → Sanitize   → CallID      → Scheduled  → Filter  → Page
2. "0x..."  → Validate   → TxHash      → GetTx      → Enhance → Details
3. "fa7e"   → Detect     → SysAccount  → Address    → Badge   → Special
```

### 3. State Management Architecture

#### Global State (Zustand)
```typescript
interface GlobalState {
  // Connection State
  realtimeStatus: ConnectionStatus
  nodeHealth: NodeHealthStatus[]
  
  // UI State
  theme: 'light' | 'dark'
  searchHistory: SearchEntry[]
  notifications: Notification[]
  
  // Cache State  
  recentBlocks: Block[]
  recentTransactions: Transaction[]
  mempoolStats: MempoolStats
}
```

#### Component State (React)
```typescript
// Local component state for page-specific data
interface ComponentState {
  loading: boolean
  error: string | null
  data: PageData
  realtime: boolean
  lastUpdate: number
}
```

##  Deployment Architecture

### 1. Docker Configuration

#### Multi-stage Build
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app  
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner  
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Environment Configuration
```bash
# Production Environment
NODE_ENV=production
NEXT_PUBLIC_RPC_URL=http://35.185.40.237:8545
NEXT_PUBLIC_WS_URL=ws://35.185.40.237:8546
NEXT_PUBLIC_NETWORK_NAME=Shrinenet
NEXT_PUBLIC_CURRENCY_SYMBOL=RITUAL

# Performance Tuning
NODE_OPTIONS="--max-old-space-size=2048"
NEXT_TELEMETRY_DISABLED=1
```

### 2. Production Scaling

#### Horizontal Scaling Strategy
```yaml
# Kubernetes Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ritual-explorer
spec:
  replicas: 3              # Multiple instances
  selector:
    matchLabels:
      app: ritual-explorer
  template:
    spec:
      containers:
      - name: ritual-explorer
        image: ritual-explorer:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"  
            cpu: "500m"
```

#### Load Balancing
```nginx
# Nginx Configuration
upstream ritual_explorer {
    server ritual-explorer-1:3000;
    server ritual-explorer-2:3000;
    server ritual-explorer-3:3000;
}

server {
    listen 80;
    server_name ritual-explorer.com;
    
    location / {
        proxy_pass http://ritual_explorer;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://ritual_explorer;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

##  Future Scalability

### 1. Performance Optimization Roadmap

#### Phase 1: Current Implementation 
- WebSocket real-time updates
- Multi-node RPC failover  
- React component optimization
- Docker containerization

#### Phase 2: Enhanced Performance 🚧
- Server-side caching layer (Redis)
- CDN integration for static assets
- Database integration for historical data
- GraphQL API for efficient queries

#### Phase 3: Enterprise Scale 📋
- Microservices architecture
- Distributed caching
- Real-time analytics pipeline
- Advanced monitoring (Prometheus/Grafana)

### 2. Technology Evolution Path

#### Current Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom lime/black theme
- **Real-time**: Native WebSocket, Custom manager
- **Blockchain**: Direct RPC calls, Enhanced parsing

#### Future Stack Evolution
- **Frontend**: Next.js 15+, React 19, Advanced features
- **State**: Zustand → Redux Toolkit Query (if needed)
- **Real-time**: WebSocket → Socket.io → Server-sent events
- **Backend**: Node.js API layer → Go/Rust microservices
- **Database**: File system → PostgreSQL → TimescaleDB
- **Caching**: Memory → Redis → Distributed cache

---

This system design provides a robust foundation for# System Design - Ritual Explorer v2.0
*Updated with 11 Contract Types & GCP Production Architecture* scaling Ritual Explorer from a single-instance application to an enterprise-grade blockchain analytics platform.
