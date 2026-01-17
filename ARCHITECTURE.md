# BlockView Architecture

## System Overview

BlockView is built as a **modular monolith** with clear separation between core domains. The architecture supports both real-time data streaming and batch processing for analytics.

---

## Core Design Principles

### 1. Event-Driven Architecture
```
On-Chain Event → Signal Detection → Alert Evaluation → Notification Dispatch
```

### 2. Domain-Driven Design
Each core module is self-contained with:
- Model (Mongoose schema)
- Repository (data access)
- Service (business logic)
- Routes (API endpoints)
- Schema (Zod validation)

### 3. Honest UI States
Every data point shows one of three states:
- **Real**: Live data from blockchain
- **Indexing**: Data being processed
- **Disabled**: Feature not available for this asset

---

## Module Architecture

### Phase A: Alert Intelligence Layer

The smart alert system transforms raw signals into intelligent, grouped notifications.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ALERT INTELLIGENCE LAYER (Phase A)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Raw Signal ──▶ [A0] ──▶ [A1] ──▶ [A2] ──▶ [A3] ──▶ [A4] ──▶ User          │
│                 │        │        │        │        │                       │
│                 │        │        │        │        └─ Dispatch             │
│                 │        │        │        │           • When to notify     │
│                 │        │        │        │           • Which channels     │
│                 │        │        │        │           • Rate limiting      │
│                 │        │        │        │                                │
│                 │        │        │        └─ Grouping                      │
│                 │        │        │           • Behavior lifecycle          │
│                 │        │        │           • active → cooling → resolved │
│                 │        │        │           • Group reasons evolve        │
│                 │        │        │                                         │
│                 │        │        └─ Severity                               │
│                 │        │           • Priority: low/medium/high            │
│                 │        │           • Score: 0-5                           │
│                 │        │           • Human-readable WHY                   │
│                 │        │                                                  │
│                 │        └─ Deduplication                                   │
│                 │           • "New or repeated?"                            │
│                 │           • Occurrence counting                           │
│                 │                                                           │
│                 └─ Normalization                                            │
│                    • Standardize signal format                              │
│                    • Extract metrics & confidence                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Principle**: "Not 10 spam messages, but one understandable story"

### Phase B: Wallet Intelligence Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WALLET INTELLIGENCE LAYER (Phase B)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  B1 - Wallet Profile (✅ Complete)                                          │
│  ├── Behavioral tags: trader, holder, whale, degen, bridge-user...         │
│  ├── Activity metrics: txCount, activeDays, firstSeen, lastSeen            │
│  ├── Flow metrics: totalIn, totalOut, netFlow, avgTxSize                   │
│  ├── Token interactions: top tokens by volume                              │
│  ├── Confidence score: based on data quality                               │
│  └── Human-readable summary: "Active high-volume trader"                   │
│                                                                             │
│  B2 - Wallet → Token Correlation (🔜 Next)                                  │
│  ├── "This token moves because of WHO?"                                    │
│  ├── Wallet influence scoring                                              │
│  └── Participation tracking                                                │
│                                                                             │
│  B3 - Wallet Clusters (📋 Backlog)                                         │
│  ├── "One actor = many addresses"                                          │
│  └── Behavioral clustering                                                 │
│                                                                             │
│  B4 - Smart Money Patterns (📋 Backlog)                                    │
│  ├── Historically profitable wallets                                       │
│  └── Correlation with outcomes                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Alert System (Core)

```
┌────────────────────────────────────────────────────────────────┐
│                        ALERT SYSTEM                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐     ┌─────────────────┐                  │
│  │  AlertRule      │────▶│  WatchlistItem  │                  │
│  │  (conditions)   │     │  (user interest)│                  │
│  └────────┬────────┘     └─────────────────┘                  │
│           │                                                    │
│           │ triggers                                           │
│           ▼                                                    │
│  ┌─────────────────┐     ┌─────────────────┐                  │
│  │  Alert          │────▶│  Notification   │                  │
│  │  (event)        │     │  (dispatch)     │                  │
│  └─────────────────┘     └─────────────────┘                  │
│                                   │                            │
│                          ┌───────┴───────┐                     │
│                          │               │                     │
│                          ▼               ▼                     │
│                     ┌────────┐     ┌──────────┐               │
│                     │ In-App │     │ Telegram │               │
│                     └────────┘     └──────────┘               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Constraint**: `AlertRule` MUST have a `watchlistItemId`. Creating an alert auto-creates the watchlist item if it doesn't exist.

### Data Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Ethereum │───▶│ Indexer  │───▶│ Signals  │───▶│ Alerts   │
│   RPC    │    │ (batch)  │    │ Engine   │    │ Dispatch │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │               │               │
                     ▼               ▼               ▼
                ┌──────────────────────────────────────┐
                │             MongoDB                   │
                │  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
                │  │transfers│ │ signals │ │ alerts  │ │
                │  └─────────┘ └─────────┘ └─────────┘ │
                └──────────────────────────────────────┘
```

---

## Backend Structure

### Core Modules (`/backend/src/core/`)

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `alerts/` | Alert rules & intelligence | `alert.pipeline.ts`, `alerts.routes.ts` |
| `alerts/normalization/` | A0 - Event normalization | `event.normalizer.ts` |
| `alerts/deduplication/` | A1 - Deduplication engine | `dedup.engine.ts` |
| `alerts/severity/` | A2 - Severity & priority | `severity.engine.ts` |
| `alerts/grouping/` | A3 - Behavior grouping | `grouping.engine.ts` |
| `alerts/dispatcher/` | A4 - Notification dispatch | `dispatcher.engine.ts` |
| `wallets/` | B1 - Wallet profiles | `wallet_profile.engine.ts` |
| `watchlist/` | User watched items | `watchlist.model.ts`, `watchlist.routes.ts` |
| `notifications/` | Telegram integration | `telegram.service.ts`, `telegram.routes.ts` |
| `resolver/` | Universal address resolver | `resolver.service.ts` |
| `tokens/` | Token metadata & seeds | `token_seeds.ts` |
| `market/` | Market data & anomalies | `flow_anomalies.service.ts` |
| `ens/` | ENS name resolution | `ens.service.ts` |
| `signals/` | Signal detection | `signals.model.ts` |
| `strategies/` | Trading strategy definitions | `strategies.model.ts` |
| `actors/` | Wallet attribution | `actors.model.ts` |
| `entities/` | Entity grouping | `entities.model.ts` |
| `reputation/` | Trust scoring | `reputation.model.ts` |

### Background Jobs (`/backend/src/jobs/`)

| Job | Schedule | Purpose |
|-----|----------|---------|
| `build_signals.job.ts` | 5 min | Detect new signals from transfers |
| `dispatch_alerts.job.ts` | 1 min | Send notifications for triggered alerts |
| `build_trust_snapshots.job.ts` | 1 hour | Update trust scores |
| `update_adaptive_weights.job.ts` | 6 hours | ML model retraining |

### API Layer (`/backend/src/api/`)

Routes are registered in `routes.ts` with prefixes:

```typescript
// Main route registration
await app.register(alertRoutes, { prefix: '/api/alerts' });
await app.register(watchlistRoutes, { prefix: '/api/watchlist' });
await app.register(telegramRoutes, { prefix: '/api/telegram' });
await app.register(resolverRoutes, { prefix: '/api' });
```

---

## Frontend Structure

### Page Components (`/frontend/src/pages/`)

| Page | Route | Purpose |
|------|-------|---------|
| `ArkhamHome.jsx` | `/` | Dashboard home |
| `TokensPage.jsx` | `/tokens/:address` | Token detail & alert creation |
| `AlertsPage.jsx` | `/alerts` | Alert rule management |
| `WatchlistPage.jsx` | `/watchlist` | Watched items |
| `SignalsPage.jsx` | `/signals` | Signal feed |
| `ActorsPage.jsx` | `/actors` | Wallet attribution |

### State Management

- **Local State**: React useState/useReducer
- **Server State**: Custom hooks with fetch
- **Real-time**: WebSocket context

```jsx
// WebSocket usage
const { isConnected, lastMessage } = useWebSocket();

// API calls via centralized client
const response = await alertsApi.createAlertRule(data);
```

### Component Library

Using **Shadcn/UI** components from `/frontend/src/components/ui/`:
- Button, Card, Dialog, Tooltip
- Form inputs with react-hook-form
- Toast notifications (sonner)

---

## Database Schema

### Collections

```
blockview/
├── alert_rules          # User alert configurations
├── alerts               # Triggered alert events
├── watchlist_items      # User watched addresses/tokens
├── telegram_connections # User Telegram links
├── signals              # Detected on-chain signals
├── transfers            # ERC20 transfer records
├── actors               # Wallet attributions
├── entities             # Entity groupings
├── strategies           # Trading strategy definitions
├── reputation_scores    # Trust/reliability scores
└── user_preferences     # User settings
```

### Indexes

Key indexes for performance:

```javascript
// alert_rules
{ userId: 1, status: 1 }
{ watchlistItemId: 1 }
{ targetId: 1 }

// watchlist_items
{ userId: 1, type: 1 }
{ "target.address": 1 }

// signals
{ timestamp: -1 }
{ type: 1, severity: 1 }
```

---

## External Integrations

### Ethereum RPC
- Primary: Infura/Alchemy
- Fallback: LlamaRPC (public)
- Used for: ENS resolution, transaction data

### Telegram Bot API
- Bot: @FOMO_a_bot
- Webhook mode for production
- Commands: `/start`, `/status`, `/disconnect`, `/help`

### ENS (Ethereum Name Service)
- Resolution via ethers.js
- Caching in MongoDB
- Reverse lookup support

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────┐
│                      Load Balancer                       │
│                    (Cloudflare/AWS)                      │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Frontend    │ │   Backend     │ │   Backend     │
│   (Static)    │ │   Instance 1  │ │   Instance 2  │
│   CDN/Vercel  │ │   (API)       │ │   (Jobs)      │
└───────────────┘ └───────┬───────┘ └───────┬───────┘
                          │                 │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │    MongoDB      │
                          │    Atlas        │
                          └─────────────────┘
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token |
| `INFURA_RPC_URL` | Yes | Ethereum RPC endpoint |
| `CORS_ORIGINS` | No | Allowed CORS origins |
| `ENS_ENABLED` | No | Enable ENS resolution |
| `WS_ENABLED` | No | Enable WebSocket server |

---

## Security Considerations

### Current Implementation
- User identification via `x-user-id` header (demo mode)
- No sensitive data in frontend
- CORS configured per environment

### Production Requirements
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] API key management
- [ ] Audit logging
- [ ] Input sanitization (Zod schemas in place)

---

## Performance Optimizations

### Backend
- Mongoose lean queries where possible
- Indexed collections
- Connection pooling
- Background job batching

### Frontend
- React.lazy for code splitting
- Debounced search inputs
- Optimistic UI updates
- WebSocket for real-time data

---

## Monitoring & Observability

### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/system/health` - Detailed system status

### Logging
- Fastify built-in logging (pino)
- Structured JSON logs
- Request ID tracking

### Metrics (Future)
- [ ] Prometheus metrics endpoint
- [ ] Request latency histograms
- [ ] Job execution tracking
