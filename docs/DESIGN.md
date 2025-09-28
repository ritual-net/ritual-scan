# Ritual Explorer - Design Document

##  Design Philosophy

### Visual Identity
The Ritual Explorer adopts a **professional, data-focused design language** inspired by Etherscan's corporate aesthetic, customized for the Ritual Network ecosystem.

#### Color Palette
- **Primary**: Lime Green (#84cc16) - Ritual Network brand color
- **Background**: Pure Black (#000000) - High contrast for readability
- **Surface**: Dark Gray variations for depth
- **Text**: White (#ffffff) for maximum contrast
- **Accent**: Lime variations for interactive elements

#### Typography
- **Primary Font**: Inter - Clean, modern sans-serif
- **Monospace**: JetBrains Mono - For addresses, hashes, and code
- **Hierarchy**: Clear font weight and size progression

### Design Principles

1. **Data First**: Information architecture prioritizes blockchain data visibility
2. **Professional Aesthetics**: Clean, corporate look suitable for enterprise use
3. **High Contrast**: Accessibility-focused color choices for readability
4. **Consistent Patterns**: Reusable components and layouts across pages
5. **Real-time Awareness**: Visual indicators for live data and connection status

##  User Interface Design

### Layout System

#### Navigation Structure
```
Header Navigation
├── Ritual Explorer (Logo/Home)
├── Blocks
├── Transactions  
├── Mempool (Real-time)
├── Scheduled (Ritual-specific)
├── Analytics
├── Ritual Analytics (Advanced)
├── Gas Tracker
└── Settings
```

#### Page Layout Pattern
```
┌─────────────────────────────────────┐
│ Header + Navigation                 │
├─────────────────────────────────────┤
│ Breadcrumb Navigation               │
├─────────────────────────────────────┤
│ Page Title + Status Indicators      │
├─────────────────────────────────────┤
│ Main Content Area                   │
│ ├─ Stats Cards (if applicable)      │
│ ├─ Data Tables/Lists                │
│ └─ Real-time Updates Section        │
└─────────────────────────────────────┘
```

### Component Design System

#### 1. Transaction Type Badges
Visual indicators for Ritual Chain's 5 transaction types:

| Type | Color | Label | Usage |
|------|-------|-------|-------|
| 0x0 | Gray | Legacy | Standard transactions |
| 0x2 | Blue | EIP-1559 | Enhanced gas transactions |
| 0x10 | Purple | Scheduled | Cron-like executions |
| 0x11 | Orange | Async Commit | TEE commitments |
| 0x12 | Green | Async Settle | Final settlements |

#### 2. System Account Badges
Special recognition for Ritual system accounts:
- **Color**: Lime green with robot emoji (🤖)
- **Accounts**: 0x...fa7e, 0x...fa8e, 0x...fa9e
- **Purpose**: Distinguish automated vs user transactions

#### 3. Real-time Status Indicators
Connection status for WebSocket updates:
- **Connected**: Green pulse + "LIVE" label
- **Disconnected**: Red dot + "OFFLINE" label  
- **Subscriber Count**: Display active connections

#### 4. Async Transaction Flow Visualization
Interactive diagram showing 3-phase async execution:
```
[User Tx] → [Commitment] → [Settlement]
    ↓           ↓             ↓
 Phase 1     Phase 2      Phase 3
```

### Responsive Design

#### Breakpoints
- **Mobile**: < 768px - Stacked layout, simplified navigation
- **Tablet**: 768px - 1024px - Compressed layout with sidebar
- **Desktop**: > 1024px - Full layout with all features

#### Mobile Adaptations
- Hamburger menu for navigation
- Stacked transaction details
- Simplified async flow diagrams
- Touch-friendly interactive elements

##  User Experience Design

### Information Architecture

#### Primary User Flows

1. **Explorer Flow**: Home → Blocks/Transactions → Details
2. **Search Flow**: Search → Results → Transaction/Block Details
3. **Real-time Flow**: Mempool → Live Updates → Transaction Tracking
4. **Ritual Flow**: Scheduled → Call ID Search → Job Monitoring
5. **Analytics Flow**: Analytics → Ritual Analytics → Deep Dive

#### User Personas

1. **Blockchain Developer**
   - Needs: Transaction debugging, gas analysis, contract interaction
   - Features: Enhanced transaction details, async flow visualization

2. **DeFi User**  
   - Needs: Transaction tracking, mempool monitoring, real-time updates
   - Features: Live mempool, WebSocket updates, search functionality

3. **Ritual Network Researcher**
   - Needs: Async adoption metrics, scheduled job analysis, system insights
   - Features: Ritual Analytics, system account tracking, Call ID search

4. **Network Operator**
   - Needs: Network health, performance metrics, real-time monitoring  
   - Features: Connection status, WebSocket monitoring, error handling

### Interaction Design

#### Real-time Updates
- **Visual Feedback**: Pulse animations for live data
- **Status Indicators**: Connection health display
- **Update Notifications**: Subtle indicators for new data
- **Auto-refresh Controls**: Manual refresh buttons as backup

#### Search Experience
- **Smart Suggestions**: Context-aware search results
- **Multiple Patterns**: Support for various input formats
- **Visual Categories**: Color-coded suggestion types
- **Recent Searches**: Persistent search history

#### Navigation Experience  
- **Breadcrumb Trails**: Clear page hierarchy
- **Active States**: Visual indication of current page
- **Quick Actions**: Prominent action buttons
- **Keyboard Support**: Full keyboard navigation

##  Component Specifications

### Transaction Details Component
```typescript
interface TransactionDetailsProps {
  transaction: EnhancedTransaction
  showAsyncFlow?: boolean
  showSystemBadges?: boolean
  realtimeUpdates?: boolean
}
```

**Features**:
- Etherscan-style horizontal layout
- Transaction type badges
- System account recognition
- Async flow visualization (conditional)
- Real-time status updates

### Async Flow Component
```typescript
interface AsyncFlowProps {
  transaction: EnhancedTransaction
  interactive?: boolean
  compact?: boolean
}
```

**Features**:
- 3-phase visualization (User → Commitment → Settlement)
- Clickable transaction hashes
- Participant address display
- Phase descriptions and timing
- Responsive layout adaptation

### Mempool Component
```typescript
interface MempoolProps {
  realtimeEnabled?: boolean
  refreshInterval?: number
  maxTransactions?: number
}
```

**Features**:
- Real-time WebSocket integration
- Connection status indicator
- Live transaction feed
- Mempool statistics cards
- Manual refresh capability

### Analytics Dashboard
```typescript
interface AnalyticsProps {
  timeRange: '1h' | '6h' | '24h' | '7d'
  metrics: RitualMetrics
  realtimeUpdates?: boolean
}
```

**Features**:
- Key metrics cards
- Transaction type distribution
- Protocol fee analysis
- System account activity
- Interactive time range selection

##  Data Visualization

### Chart Types
1. **Transaction Distribution**: Donut charts for type breakdown
2. **Timeline Charts**: Line graphs for adoption trends  
3. **Metric Cards**: Large numbers with trend indicators
4. **Progress Bars**: Percentage-based metrics
5. **Status Grids**: System account activity matrices

### Visual Encoding
- **Colors**: Consistent with transaction type palette
- **Animation**: Subtle transitions and loading states
- **Accessibility**: High contrast ratios, screen reader support
- **Responsiveness**: Scalable charts for all screen sizes

##  Theme System

### Lime/Black Theme Implementation
```css
:root {
  --color-primary: #84cc16;     /* Lime 500 */
  --color-primary-dark: #65a30d; /* Lime 600 */  
  --color-primary-light: #a3e635; /* Lime 400 */
  --color-background: #000000;   /* Pure Black */
  --color-surface: #0a0a0a;     /* Near Black */
  --color-text: #ffffff;        /* White */
  --color-text-muted: #84cc16;  /* Lime for muted */
}
```

### Component States
- **Default**: Lime borders, black backgrounds
- **Hover**: Lighter lime, subtle glow effects
- **Active**: White text, lime backgrounds  
- **Disabled**: Reduced opacity, gray tints
- **Loading**: Pulse animations with lime accents

### Accessibility Features
- **WCAG 2.2 AA Compliance**: All color combinations tested
- **Focus Indicators**: High-contrast focus rings
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Motion Preferences**: Respect prefers-reduced-motion

##  Animation & Transitions

### Micro-interactions
- **Button Hovers**: Subtle color transitions (200ms)
- **Card Hovers**: Elevation changes with shadows
- **Loading States**: Pulse animations for real-time data
- **Page Transitions**: Smooth fade-in effects

### Real-time Animations
- **Connection Status**: Pulsing indicators for live data
- **New Data**: Gentle flash animations for updates
- **Error States**: Shake animations for failures
- **Success States**: Checkmark animations for confirmations

### Performance Considerations
- **CSS Transforms**: Hardware acceleration for smooth animations
- **Animation Budgets**: Maximum 16ms per frame
- **Reduced Motion**: Fallbacks for accessibility preferences
- **Battery Awareness**: Reduced animations on low battery

##  Mobile-First Approach

### Progressive Enhancement
1. **Core Functionality**: All features work without JavaScript
2. **Enhanced Experience**: Real-time updates with WebSocket
3. **Advanced Features**: Desktop-specific layouts and interactions

### Touch Interactions
- **Minimum Touch Targets**: 44px minimum for tap areas  
- **Gesture Support**: Swipe navigation where appropriate
- **Haptic Feedback**: Native feedback for interactions
- **Safe Areas**: Respect device safe areas and notches

### Performance Optimization
- **Code Splitting**: Route-based and feature-based splitting
- **Image Optimization**: Next.js automatic image optimization
- **Caching Strategy**: Aggressive caching for static assets
- **Preloading**: Smart preloading for likely user actions

---

This design document serves as the foundation for maintaining consistent, accessible, and performant user interfaces across the Ritual Explorer ecosystem.
