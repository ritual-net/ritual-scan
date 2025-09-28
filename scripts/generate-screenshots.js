const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const pages = [
  {
    name: 'homepage',
    url: '/',
    title: 'Ritual Explorer Homepage',
    description: 'Enhanced dashboard with comprehensive contract monitoring and real-time deployment status'
  },
  {
    name: 'blocks',
    url: '/blocks',
    title: 'Blocks Explorer',
    description: 'Real-time block explorer with detailed block information'
  },
  {
    name: 'transactions',
    url: '/transactions',
    title: 'Transaction Explorer',
    description: 'Live transaction feed with Ritual Chain transaction types'
  },
  {
    name: 'mempool',
    url: '/mempool',
    title: 'Real-time Mempool',
    description: 'Live mempool monitoring with WebSocket updates'
  },
  {
    name: 'scheduled',
    url: '/scheduled',
    title: 'Scheduled Transactions',
    description: 'Ritual Chain scheduled transaction pool with Call ID filtering'
  },
  {
    name: 'settings',
    url: '/settings',
    title: 'Settings & Configuration',
    description: 'Network configuration, RPC endpoints, and connection testing interface'
  },
  {
    name: 'ritual-analytics',
    url: '/ritual-analytics',
    title: 'Ritual Chain Analytics',
    description: 'Advanced analytics for Ritual Chain features and adoption metrics'
  },
  {
    name: 'analytics',
    url: '/analytics',
    title: 'Interactive Analytics Dashboard',
    description: 'Plotly charts with multiple time aggregations (per-block, 5min, 30min, 1hr) - Fixed runtime errors'
  },
  {
    name: 'block-detail',
    url: '/block/75255',
    title: 'Block Details',
    description: 'Detailed block information with Etherscan-style layout'
  },
  // NOTE: These are EXAMPLE transaction hashes - actual types need to be verified
  // We should manually verify transaction types before claiming them
  {
    name: 'transaction-detail-example',
    url: '/tx/0x15b8a881952af04dba8a68b7c2989c2460b4c140be9fda4bc3244a4a32154868',
    title: 'Transaction Detail Example',
    description: 'Example transaction detail page showing enhanced Ritual Chain event parsing and contract integration'
  }
];

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function generateScreenshots() {
  console.log('🔄 Starting screenshot generation...');
  
  await ensureDirectoryExists(SCREENSHOT_DIR);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  
  // Set user agent to avoid detection
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  let successCount = 0;
  let errorCount = 0;

  for (const pageInfo of pages) {
    try {
      console.log(`📸 Capturing ${pageInfo.name}...`);
      
      const fullUrl = `${BASE_URL}${pageInfo.url}`;
      
      // Navigate to page
      await page.goto(fullUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      // Wait for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try to wait for specific elements that indicate the page is fully loaded
      try {
        if (pageInfo.name === 'homepage') {
          await page.waitForSelector('[data-testid="latest-blocks"], .text-white', { timeout: 5000 });
        } else if (pageInfo.name === 'mempool') {
          await page.waitForSelector('.animate-pulse, .text-lime-400', { timeout: 5000 });
        } else if (pageInfo.name === 'settings') {
          await page.waitForSelector('input, .bg-white\\/5', { timeout: 5000 });
        } else if (pageInfo.name.startsWith('tx-') || pageInfo.name === 'transaction-detail-example') {
          await page.waitForSelector('.text-lime-400, .bg-white\\/5, .font-mono', { timeout: 10000 });
          
          // Try to click on "Raw Event Logs" section to expand it
          try {
            // Look for buttons or headings containing "Raw" or "Event Logs" 
            const expandButton = await page.evaluate(() => {
              const elements = document.querySelectorAll('h3, button, div[role="button"]');
              for (let el of elements) {
                if (el.textContent && el.textContent.includes('Raw Event Logs')) {
                  return el;
                }
              }
              return null;
            });
            
            if (expandButton) {
              await page.evaluate((element) => {
                element.click();
              }, expandButton);
              console.log(`📋 Clicked Raw Event Logs for ${pageInfo.name}`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for expansion
            } else {
              console.log(`📋 No Raw Event Logs section found for ${pageInfo.name}`);
            }
          } catch (clickError) {
            console.log(`⚠️ Could not find/click Raw Event Logs for ${pageInfo.name}:`, clickError.message);
          }
        } else if (pageInfo.name === 'analytics') {
          await page.waitForSelector('.plotly, canvas, svg', { timeout: 8000 });
        } else {
          await page.waitForSelector('h1, .text-lime-400', { timeout: 5000 });
        }
      } catch (waitError) {
        console.log(`⚠️ Selector wait timeout for ${pageInfo.name}, proceeding with screenshot`);
      }

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        captureBeyondViewport: true
      });

      console.log(`✅ Screenshot saved: ${pageInfo.name}.png`);
      successCount++;

    } catch (error) {
      console.error(`❌ Failed to capture ${pageInfo.name}:`, error.message);
      errorCount++;
    }
  }

  await browser.close();

  console.log(`\n📊 Screenshot Generation Complete:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  return { successCount, errorCount, screenshots: pages };
}

async function generateReadmeContent(screenshots) {
  const readmePath = path.join(__dirname, '..', 'README.md');
  
  const readmeContent = `# Ritual Explorer - Advanced Blockchain Explorer

![Ritual Explorer](https://img.shields.io/badge/Ritual-Explorer-84cc16?style=for-the-badge&logo=blockchain&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)
![Real-time](https://img.shields.io/badge/WebSocket-Real--time-84cc16?style=for-the-badge)

A production-ready, high-performance blockchain explorer built specifically for **Ritual Chain** with advanced features including async transaction visualization, scheduled job monitoring, and real-time WebSocket updates.

## 🌟 Key Features

### 🎯 **Ritual Chain Specific Features**
- **Async Transaction Flow Visualization** - Interactive diagrams showing 3-phase async execution
- **Scheduled Transaction Pool** - Real-time monitoring of cron-like blockchain jobs
- **System Account Recognition** - Special handling for Ritual system accounts (0x...fa7e, fa8e, fa9e)
- **Enhanced Transaction Types** - Support for Types 0x10 (Scheduled), 0x11 (AsyncCommitment), 0x12 (AsyncSettlement)
- **Advanced Search** - Call ID search, origin transaction linking, precompile address recognition

### ⚡ **High-Performance Real-Time Updates**
- **WebSocket Integration** - Direct connection to RETH nodes for instant updates
- **Multi-frequency Polling** - High-frequency mempool updates (2s), backup polling (5s)
- **Smart Reconnection** - Exponential backoff with jitter for resilient connections
- **Live Status Indicators** - Real-time connection status and subscriber count

### 📊 **Advanced Analytics**
- **Ritual Analytics Dashboard** - Async adoption metrics, protocol fee analysis
- **Transaction Type Distribution** - Visual breakdown of all 5 transaction types
- **System Account Activity** - Monitoring of automated vs user transactions
- **Precompile Usage Statistics** - Top async precompile contracts

## 🖼️ Screenshots

${screenshots.map(page => `
### ${page.title}

![${page.title}](./docs/screenshots/${page.name}.png)

${page.description}
`).join('\n')}

## 🏗️ Architecture

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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Docker (optional)
- Access to Ritual Chain RETH nodes

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ritual-explorer

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
\`\`\`

### Docker Deployment

\`\`\`bash
# Build and run with Docker
docker build -t ritual-explorer .
docker run -d -p 9000:3000 --name ritual-explorer ritual-explorer
\`\`\`

## 🔧 Configuration

### Environment Variables

\`\`\`env
# RPC Configuration
NEXT_PUBLIC_RPC_URL=http://35.185.40.237:8545
NEXT_PUBLIC_WS_URL=ws://35.185.40.237:8546

# Network Configuration  
NEXT_PUBLIC_NETWORK_NAME=Shrinenet
NEXT_PUBLIC_CURRENCY_SYMBOL=RITUAL
\`\`\`

### Real-Time WebSocket

The explorer automatically connects to RETH WebSocket endpoints for:
- New block headers (\`eth_subscribe\` → \`newHeads\`)
- Pending transactions (\`eth_subscribe\` → \`newPendingTransactions\`)  
- Mempool updates (high-frequency polling)
- Scheduled transaction monitoring

## 🎨 Ritual Chain Features

### **Transaction Types Supported**

| Type | Description | System Account | Features |
|------|-------------|----------------|----------|
| 0x0 | Legacy | N/A | Standard Ethereum transactions |
| 0x2 | EIP-1559 | N/A | Enhanced gas mechanism |
| 0x10 | Scheduled | 0x...fa7e | Cron-like execution, Call ID tracking |
| 0x11 | AsyncCommitment | 0x...fa8e | TEE execution commitment |
| 0x12 | AsyncSettlement | 0x...fa9e | Final settlement with fee distribution |

### **Enhanced Search Patterns**

- \`callId:10567\` - Search scheduled transactions by Call ID
- \`origin:0x...\` - Find transactions by origin hash
- \`10567\` - Numeric Call ID search
- System account detection (fa7e, fa8e, fa9e)
- Precompile addresses (0x...0801, etc.)

## 📱 Pages & Features

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

## 🔗 Live Demo

**Production URL:** [Browser Preview Available](http://127.0.0.1:63901)

**Real-Time Features:**
- ✅ WebSocket connection to RETH nodes
- ✅ Live mempool updates every 2 seconds  
- ✅ New block notifications
- ✅ Scheduled transaction monitoring
- ✅ Connection status indicators

## 🛠️ Development

### **Project Structure**

\`\`\`
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
\`\`\`

### **Key Components**

- **RETHClient** - Enhanced with Ritual-specific RPC methods
- **WebSocket Manager** - High-performance real-time updates
- **Transaction Flow** - Async relationship visualization  
- **System Recognition** - Ritual system account handling
- **Search Enhancement** - Call ID and precompile search

## 🔍 Testing

### **Automated Testing**

\`\`\`bash
# Run component tests
npm test

# Generate screenshots  
npm run screenshots

# Test navigation flows
node test-navigation.js
\`\`\`

### **Real-Time Testing**

The explorer includes extensive real-time testing:
- WebSocket connection monitoring
- Transaction type detection
- System account recognition  
- Async flow visualization
- Call ID search functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'Add amazing feature'\`)
4. Push to branch (\`git push origin feature/amazing-feature\`)  
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ritual Network** for the innovative async execution model
- **RETH** for high-performance Ethereum execution
- **Next.js Team** for the excellent React framework
- **Etherscan** for UI/UX inspiration

---

<div align="center">
  <strong>Built with ❤️ for the Ritual Network ecosystem</strong>
</div>
`;

  await fs.writeFile(readmePath, readmeContent);
  console.log(`📝 README.md updated with screenshots`);
}

// Run the script
if (require.main === module) {
  generateScreenshots()
    .then(async (result) => {
      await generateReadmeContent(result.screenshots);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Screenshot generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateScreenshots, generateReadmeContent };
