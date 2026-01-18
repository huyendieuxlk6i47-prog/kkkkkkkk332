# BlockView — Blockchain Analytics Platform

<div align="center">

![Version](https://img.shields.io/badge/version-3.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green)
![License](https://img.shields.io/badge/license-MIT-green)

**Real-time blockchain intelligence with smart alerts and wallet profiles**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-reference) • [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

BlockView is a production-grade blockchain analytics platform that transforms on-chain data into actionable insights. Unlike traditional block explorers, BlockView focuses on **signal detection**, **intelligent alert grouping**, and **wallet behavior analysis**.

### Core Philosophy

```
Tokens without Alerts = справочник (reference)
Tokens with Alerts = инструмент (tool)
Smart Alerts = "не 10 спам-сообщений, а одна понятная история"
```

The platform is designed around three key principles:
1. **Event-driven alerts** - viewing data is passive, receiving alerts is actionable
2. **Intelligent grouping** - behavior groups, not event spam
3. **Wallet profiles** - understand WHO, not just WHAT

---

## ✨ Features

### 🧠 Smart Alert System (Phase A - Complete)
The Alert Intelligence Layer transforms raw blockchain signals into meaningful, actionable notifications.

| Layer | Purpose | Status |
|-------|---------|--------|
| **A0 - Normalization** | Standardize all signal types | ✅ |
| **A1 - Deduplication** | "Is this new or repeated?" | ✅ |
| **A2 - Severity** | "How important is this?" | ✅ |
| **A3 - Grouping** | "Is this ongoing behavior?" | ✅ |
| **A4 - Dispatcher** | "When and where to notify?" | ✅ |

**Key Benefits:**
- 80% reduction in alert noise through grouping
- Priority-based notifications (low/medium/high)
- Rate limiting prevents spam (10/hour, 15min per group)
- Lifecycle tracking: active → cooling → resolved
- Human-readable reasons: "Large wallets continue accumulating USDT"

### 🏦 Wallet Intelligence (Phase B1 - Complete)
Answer the question: "Who is this wallet?"

- **Behavioral Tags**: trader, holder, whale, degen, bridge-user, etc.
- **Activity Metrics**: tx count, active days, first/last seen
- **Flow Analysis**: total in/out, net flow, avg transaction size
- **Token Interactions**: top tokens by volume
- **Confidence Score**: based on data quality
- **Human-readable Summaries**: "Active high-volume trader"

### 🔗 Wallet → Token Correlation (Phase B2 - Skeleton)
Answer the question: "Who is driving this token's activity?"

- **Driver Analysis**: Identify wallets influencing token price
- **Role Classification**: Accumulator, Distributor, Market Maker
- **Influence Scoring**: Quantify wallet impact on token
- **Participation Metrics**: buy/sell count, volume, timing

### 🕸 Wallet Clusters (Phase B3 - Skeleton)
Answer the question: "Is this one person with many wallets?"

- **Behavioral Clustering**: Group wallets by similar patterns
- **Entity Attribution**: Link addresses to single actor
- **Confidence Scoring**: Reliability of cluster assignment
- **Evidence Tracking**: Why wallets are grouped together

### 🧠 Smart Money Patterns (Phase B4 - Skeleton)
Answer the question: "Should I follow this wallet?"

- **Performance Tracking**: Historical ROI analysis
- **Accuracy Scoring**: Entry/exit timing quality
- **Pattern Recognition**: Accumulation/distribution detection
- **Smart Money Labels**: Whale, Insider, Bot, etc.

### 🔔 Alert Management
- **Create alerts** for tokens, wallets, and actors
- **Signal types**: Accumulation, Distribution, Large Move, Smart Money Entry/Exit
- **Multi-channel notifications**: In-App + Telegram
- **Alert lifecycle**: Pause, Resume, Delete via UI
- **Watchlist integration**: Alerts auto-create watchlist items

### 🎨 User Experience
- **Human-friendly language**: "Analyzing wallet" instead of "Indexing"
- **Clear status indicators**: Confidence levels, data availability
- **Intelligent empty states**: Helpful suggestions when no data
- **Progressive disclosure**: Show what's available, explain what's coming

### 📊 Market Intelligence
- Real-time flow anomaly detection (z-score based)
- Asset-specific metrics (ETH primary, others indexing)
- Confidence-gated data display

### 🔍 Universal Resolver
- ENS name resolution (vitalik.eth → 0x...)
- Token address lookup with metadata
- Wallet clustering and attribution

### 📱 Telegram Integration
- Bot: [@FOMO_a_bot](https://t.me/FOMO_a_bot)
- Commands: `/start`, `/status`, `/disconnect`, `/help`
- Real-time alert delivery with priority indicators

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **MongoDB** 6.0+
- **yarn** (recommended) or npm

### 1. Clone & Install

```bash
git clone https://github.com/your-org/blockview.git
cd blockview

# Backend
cd backend
yarn install

# Frontend
cd ../frontend
yarn install
```

### 2. Environment Setup

**Backend** (`/backend/.env`):
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=blockview
MONGODB_URI=mongodb://localhost:27017/blockview

# CORS (comma-separated origins or "*")
CORS_ORIGINS=*

# ENS Resolution
ENS_ENABLED=true
INFURA_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# WebSocket
WS_ENABLED=true

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
```

**Frontend** (`/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
```

### 3. Start Services

```bash
# Terminal 1: MongoDB
mongod --dbpath /data/db

# Terminal 2: Backend (port 8002 internally, proxied to 8001)
cd backend
yarn dev

# Terminal 3: Frontend (port 3000)
cd frontend
yarn start
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:8001/api/health

# Expected response:
# {"ok":true,"ts":...,"uptime":...}
```

---

## 🏗 Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Market   │ │ Tokens   │ │ Alerts   │ │Watchlist │           │
│  │ Page     │ │ Page     │ │ Page     │ │ Page     │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                         │                                       │
│                    WebSocket + REST API                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                     BACKEND (Fastify/TypeScript)                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      API Layer                           │   │
│  │  /api/alerts  /api/watchlist  /api/resolve  /api/market │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────┴───────────────────────────────┐   │
│  │                    Core Modules                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │ Alerts  │ │Watchlist│ │ Resolver│ │ Market  │        │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │   │
│  │       │           │           │           │              │   │
│  │  ┌────┴───────────┴───────────┴───────────┴────┐        │   │
│  │  │              MongoDB (Mongoose)              │        │   │
│  │  └──────────────────────────────────────────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Background Jobs (Scheduler)              │   │
│  │  • Signal Detection  • Trust Scoring  • ERC20 Indexing   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  External Integrations                    │   │
│  │  • Telegram Bot API  • Ethereum RPC  • ENS               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
blockview/
├── backend/
│   ├── src/
│   │   ├── api/                    # Route definitions
│   │   │   ├── routes.ts           # Main router
│   │   │   ├── health.routes.ts    # Health checks
│   │   │   └── system.routes.ts    # System endpoints
│   │   │
│   │   ├── core/                   # Business logic modules
│   │   │   ├── alerts/             # 🔔 Alert system
│   │   │   │   ├── normalization/  # A0 - Event normalization
│   │   │   │   ├── deduplication/  # A1 - Deduplication engine
│   │   │   │   ├── severity/       # A2 - Severity & priority
│   │   │   │   ├── grouping/       # A3 - Behavior grouping
│   │   │   │   ├── dispatcher/     # A4 - Notification dispatch
│   │   │   │   ├── alert_rules.model.ts
│   │   │   │   ├── alert.pipeline.ts  # Unified A0→A4 pipeline
│   │   │   │   └── alerts.routes.ts
│   │   │   │
│   │   │   ├── wallets/            # 🏦 Wallet Intelligence (B1)
│   │   │   │   ├── wallet_profile.schema.ts
│   │   │   │   ├── wallet_profile.model.ts
│   │   │   │   ├── wallet_profile.engine.ts
│   │   │   │   └── wallet.routes.ts
│   │   │   │
│   │   │   ├── watchlist/          # 📋 User watchlist
│   │   │   │   ├── watchlist.model.ts
│   │   │   │   └── watchlist.routes.ts
│   │   │   │
│   │   │   ├── notifications/      # 📱 Telegram integration
│   │   │   │   ├── telegram.service.ts
│   │   │   │   └── telegram.routes.ts
│   │   │   │
│   │   │   ├── resolver/           # 🔍 Universal resolver
│   │   │   ├── tokens/             # 🪙 Token management
│   │   │   ├── market/             # 📊 Market data
│   │   │   ├── ens/                # ENS resolution
│   │   │   ├── signals/            # Signal detection
│   │   │   ├── strategies/         # Trading strategies
│   │   │   └── ...                 # 40+ modules
│   │   │
│   │   ├── jobs/                   # Background workers
│   │   │   ├── scheduler.ts        # Job orchestration
│   │   │   ├── build_signals.job.ts
│   │   │   ├── dispatch_alerts.job.ts
│   │   │   └── ...
│   │   │
│   │   ├── onchain/                # Blockchain integration
│   │   │   └── ethereum/
│   │   │       ├── ethereum.rpc.ts
│   │   │       └── erc20.indexer.ts
│   │   │
│   │   ├── db/                     # Database setup
│   │   │   ├── mongoose.ts
│   │   │   └── indexes.ts
│   │   │
│   │   ├── ws/                     # WebSocket server
│   │   │   ├── ws.server.ts
│   │   │   └── ws.types.ts
│   │   │
│   │   ├── config/
│   │   │   └── env.ts              # Environment config
│   │   │
│   │   ├── app.ts                  # Fastify app setup
│   │   └── server.ts               # Entry point
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── AlertsPage.jsx      # 🔔 Alert management
│   │   │   ├── TokensPage.jsx      # 🪙 Token detail
│   │   │   ├── WalletsPage.jsx     # 🏦 Wallet profiles
│   │   │   ├── WatchlistPage.jsx   # 📋 Watchlist
│   │   │   ├── ArkhamHome.jsx      # 🏠 Dashboard
│   │   │   └── ...
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn/UI components
│   │   │   ├── CreateAlertModal.jsx
│   │   │   ├── WalletProfileCard.jsx  # B1 wallet display
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── UnifiedCard.jsx     # Unified card system
│   │   │   └── ...
│   │   │
│   │   ├── api/                    # API client
│   │   │   ├── client.js           # Axios instance
│   │   │   ├── alerts.api.js
│   │   │   ├── wallets.api.js      # B1 wallet API
│   │   │   └── ...
│   │   │
│   │   ├── context/
│   │   │   └── WebSocketContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js
│   │   │   └── useBootstrapProgress.js
│   │   │
│   │   └── App.js
│   │
│   └── package.json
│
├── memory/
│   └── PRD.md                      # Product requirements
│
└── README.md
```

### Key Data Models

#### AlertRule
```typescript
interface AlertRule {
  _id: ObjectId;
  userId: string;
  watchlistItemId: ObjectId;      // 🔑 Required link to WatchlistItem
  
  // Target
  scope: 'token' | 'wallet' | 'actor' | 'entity' | 'strategy';
  targetType: 'token' | 'wallet' | 'actor';
  targetId: string;
  
  // Trigger configuration
  triggerTypes: AlertTriggerType[];
  trigger: {
    type: string;
    params?: {
      amount?: number;
      window?: '1h' | '6h' | '24h';
      direction?: 'in' | 'out';
    };
  };
  
  // Notification channels
  channels: {
    inApp: boolean;
    telegram: boolean;
  };
  
  // State
  status: 'active' | 'paused';
  active: boolean;
  triggerCount: number;
  lastTriggeredAt?: Date;
}
```

#### WatchlistItem
```typescript
interface WatchlistItem {
  _id: ObjectId;
  userId: string;
  type: 'token' | 'wallet' | 'actor' | 'entity';
  target: {
    address: string;
    chain: string;
    symbol?: string;
    name?: string;
  };
  note?: string;
  tags?: string[];
  alertCount: number;  // Computed: active alerts for this item
}
```

---

## 📡 API Reference

### Smart Alerts (Phase A)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/alerts/rules` | Create alert rule |
| `GET` | `/api/alerts/rules` | List user's alert rules |
| `PUT` | `/api/alerts/rules/:id` | Update rule (pause/resume) |
| `DELETE` | `/api/alerts/rules/:id` | Delete rule |
| `GET` | `/api/alerts/feed` | Get triggered alerts feed |
| `POST` | `/api/alerts/:id/ack` | Acknowledge alert |
| `POST` | `/api/alerts/ack-all` | Acknowledge all alerts |
| `GET` | `/api/notifications` | Get notification history |
| `GET` | `/api/preferences` | Get user alert preferences |
| `PUT` | `/api/preferences` | Update alert preferences |

### Wallet Intelligence (Phase B1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wallets/:address` | Get wallet profile |
| `POST` | `/api/wallets/profile` | Build/refresh wallet profile |
| `GET` | `/api/wallets/search?tags=` | Search wallets by tags |
| `GET` | `/api/wallets/high-volume` | Get high-volume wallets |
| `GET` | `/api/wallets/tags` | Get available wallet tags |

### Watchlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/watchlist` | Get user's watchlist |
| `POST` | `/api/watchlist` | Add item to watchlist |
| `DELETE` | `/api/watchlist/:id` | Remove from watchlist |
| `GET` | `/api/watchlist/:id` | Get single item with alert count |

### Telegram

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/telegram/connection` | Check connection status |
| `POST` | `/api/telegram/connect` | Generate connect link |
| `POST` | `/api/telegram/disconnect` | Disconnect account |
| `POST` | `/api/telegram/test` | Send test notification |
| `POST` | `/api/telegram/webhook` | Telegram webhook (internal) |

### Resolver

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/resolve?input=...` | Resolve address/ENS/token |

### Market

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/market/flow-anomalies` | Get flow anomaly z-scores |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/system/health` | Detailed system status |

---

## 🔐 Authentication

Currently uses `x-user-id` header for user identification:

```bash
curl -X GET "https://api.blockview.com/api/alerts/rules" \
  -H "x-user-id: user-123"
```

> **Note**: Production deployment should implement proper JWT/OAuth authentication.

---

## 📊 Signal Types

| Type | Description | Use Case |
|------|-------------|----------|
| `accumulation` | Net inflow of tokens | Detect buying pressure |
| `distribution` | Net outflow of tokens | Detect selling pressure |
| `large_move` | Single large transfer | Track whale movements |
| `smart_money_entry` | Smart money inflow | Follow smart traders |
| `smart_money_exit` | Smart money outflow | Exit signal |
| `net_flow_spike` | Unusual flow activity | Anomaly detection |
| `activity_spike` | Transfer volume spike | Activity monitoring |

---

## 🗺 Roadmap

### ✅ Completed

- **P0: Core Alert System** - Full CRUD, multi-channel notifications
- **P1: Alert Management** - Pause/Resume/Delete via UI
- **P1: Watchlist Integration** - Auto-creation, alert counts
- **P1: UI Enhancements** - Target context, summary, lastTriggeredAt
- **Phase A: Alert Intelligence Layer** - Smart alerts with grouping
  - A0: Event Normalization
  - A1: Deduplication Engine
  - A2: Severity & Priority Engine
  - A3: Grouping Engine (lifecycle management)
  - A4: Dispatcher (rate limiting, user preferences)
- **Phase B1: Wallet Profile** - Wallet behavior analysis
  - Behavioral tags derivation
  - Activity & flow metrics
  - Confidence scoring
  - Human-readable summaries
- **Phase B2-B4: Architecture** - Backend schemas, APIs, UI components (skeleton)
  - B2: Wallet → Token Correlation engine & API
  - B3: Wallet Clusters engine & API
  - B4: Smart Money Patterns engine & API
- **UX Polish** - Human-friendly language throughout UI
  - Replaced "Indexing" → "Analyzing" terminology
  - Improved empty states and loading messages
  - Clear confidence indicators
  - Better error and status communication

### 🔜 In Progress

- **Phase B2-B4: Full Implementation**
  - Complete correlation algorithms
  - Cluster detection logic
  - Smart money scoring

### 📋 Backlog

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| B2-B4 Algorithms | B | P1 | Full implementation of wallet correlation, clustering, smart money |
| Multi-chain | - | P2 | Arbitrum, BNB Chain support |
| Token Tabs | - | P2 | Overview, Flows, Holders views |
| Signal Explanations | - | P2 | "Why was this detected?" |
| Telegram Mute | - | P2 | "Mute for 24h" button |
| Production Infra | - | P2 | Nginx reverse proxy, Redis caching |

---

## 📝 Recent Changes (v3.1.0)

### January 2026

#### 🔧 Bug Fixes
- **Wallet Alerts**: Fixed `CreateWalletAlertModal` to use correct backend trigger types (`accumulation`, `distribution`, `large_move`, `smart_money_entry`, `activity_spike`)
- **Legacy Indexing Logic**: Removed `confidence < 0.4 = indexing` logic - backend status is now single source of truth
- **Search Stability**: Improved resolver integration on Wallets and Tokens pages

#### ✨ UX Improvements
- Replaced all "Indexing" terminology with "Analyzing" across UI
- Updated empty states with clearer, actionable descriptions
- Improved loading messages: "Looking up wallet...", "Gathering activity data"
- Better confidence messaging: "Limited on-chain activity" instead of technical terms
- Enhanced hints: "You can leave this page — analysis continues in background"

#### 🏗 Architecture
- Phase B2-B4 backend schemas, models, and API endpoints implemented (skeleton)
- `TrackWalletButton` component integrated into WalletsPage
- Unified alert creation flow for both tokens and wallets

---

## 🛠 Development

### Running Tests

```bash
# Backend
cd backend
yarn test

# Frontend
cd frontend
yarn test
```

### Linting

```bash
# Backend (TypeScript)
cd backend
yarn lint

# Frontend (ESLint)
cd frontend
yarn lint
```

### Database Migrations

The schema uses Mongoose with auto-migration. New fields are added with defaults.

```bash
# Manual migration example (if needed)
mongosh blockview --eval "db.alert_rules.updateMany({targetType: null}, {$set: {targetType: 'token'}})"
```

---

## 🐛 Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Mongoose duplicate index warnings | Low | Known, non-blocking |
| ERC20 indexer RPC rate limits | Medium | Retry logic in place |
| WebSocket reconnection on mobile | Low | Backoff implemented |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

<div align="center">
  <sub>Built with ❤️ for the blockchain community</sub>
</div>
