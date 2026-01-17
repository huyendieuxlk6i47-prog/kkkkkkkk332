# BlockView — Product Requirements Document

## 📋 Overview

**Product**: BlockView - Blockchain Analytics Platform  
**Version**: 3.0.0  
**Last Updated**: 2026-01-17

### Vision
Transform on-chain data from passive reference into actionable intelligence through smart alerts and wallet behavior analysis.

### Core Principles
```
Tokens without Alerts = справочник (reference)
Tokens with Alerts = инструмент (tool)
Smart Alerts = "не 10 спам-сообщений, а одна понятная история"
Wallet Profiles = "кто это? Трейдер? Фонд? Кит?"
```

---

## 🎯 User Personas

### Crypto Trader
- Monitors specific tokens for accumulation/distribution signals
- Wants real-time alerts on significant movements
- Uses Telegram for mobile notifications
- Needs to understand WHO is driving token movements

### DeFi Researcher
- Tracks smart money wallets
- Analyzes flow patterns
- Needs confidence-gated data
- Wants wallet behavior profiles

### Portfolio Manager
- Watches multiple assets
- Requires audit trail of alerts
- Needs pause/resume functionality
- Values grouped, non-spammy notifications

---

## ✅ Implemented Features

### Phase 1-2: Core Platform
- [x] Real-time data pipeline
- [x] Background bootstrap worker
- [x] ENS integration
- [x] WebSocket-based UI updates

### Option B: Production Hardening
- [x] B0-B6: Health, metrics, events, locks, heartbeats
- [x] Honest UI states (Real/Indexing/Disabled)

### P0: Market Page
- [x] Asset Selector (ETH primary)
- [x] Flow Anomalies with real API
- [x] All blocks with honest states

### P0/P1/P2: Tokens Page
- [x] 3 states: Entry → Indexing → Resolved
- [x] Token Activity block
- [x] Token Signals with explanations
- [x] Confidence gating (≥0.6)
- [x] Token Seeds for known tokens

### P0: Alert System
- [x] AlertRule ↔ WatchlistItem coupling
- [x] Auto-creation of WatchlistItem
- [x] Signal types: accumulation, distribution, large_move, smart_money_entry/exit
- [x] Multi-channel: In-App + Telegram
- [x] CRUD operations via API

### P1: Alert Management
- [x] AlertsPage with rules list
- [x] Filter tabs (All/Active/Paused)
- [x] Pause/Resume/Delete buttons
- [x] Stats display

### Phase A: Alert Intelligence Layer ✅ COMPLETE
Smart alerts that group behavior, not spam events.

| Layer | Purpose | Status |
|-------|---------|--------|
| A0 - Normalization | Standardize signal format | ✅ |
| A1 - Deduplication | "New or repeated?" | ✅ |
| A2 - Severity | "How important?" (0-5 score) | ✅ |
| A3 - Grouping | Behavior lifecycle management | ✅ |
| A4 - Dispatcher | When/where to notify + rate limits | ✅ |

**Key Features:**
- Grouping by behavior (not time): `groupKey = scope + targetId + signalType`
- Lifecycle: `active` → `cooling` → `resolved`
- Severity decay over time
- Rate limiting: 10/hour per user, 15min per group
- Human-readable reasons that evolve

### Phase B1: Wallet Profile ✅ COMPLETE
Answer: "Who is this wallet?"

- [x] Behavioral tags: active, dormant, new, high-volume, whale, trader, holder, flipper, degen, bridge-user, etc.
- [x] Activity metrics: firstSeen, lastSeen, activeDays, txCount
- [x] Flow metrics: totalIn, totalOut, netFlow, avgTxSize
- [x] Token interactions: top tokens by volume
- [x] Confidence scoring
- [x] Human-readable summaries
- [x] API endpoints for profile CRUD
- [x] WalletProfileCard UI component

---

## 📊 Technical Specifications

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Tailwind CSS |
| Backend | TypeScript + Fastify |
| Database | MongoDB 6.0 + Mongoose |
| Real-time | WebSocket (@fastify/websocket) |
| Blockchain | ethers.js (ENS) |
| Notifications | Telegram Bot API |

### Key Data Models

#### AlertGroup (Phase A)
```typescript
{
  groupId: string,
  scope: 'token' | 'wallet' | 'actor',
  targetId: string,
  signalType: string,
  status: 'active' | 'cooling' | 'resolved',
  priority: 'low' | 'medium' | 'high',
  eventCount: number,
  peakSeverity: number,
  lastSeverity: number,
  reason: { summary, context },
  startedAt: Date,
  lastUpdatedAt: Date
}
```

#### WalletProfile (Phase B1)
```typescript
{
  address: string,
  chain: string,
  activity: { firstSeen, lastSeen, activeDays, txCount },
  flows: { totalIn, totalOut, netFlow, avgTxSize },
  behavior: { dominantAction, burstinessScore },
  tokens: { interactedCount, topTokens[] },
  tags: string[],
  confidence: number,
  summary: { headline, description }
}
```

### API Endpoints

| Category | Endpoints |
|----------|-----------|
| Alerts | `POST/GET/PUT/DELETE /api/alerts/rules` |
| Notifications | `GET /api/notifications` |
| Preferences | `GET/PUT /api/preferences` |
| Wallets | `GET/POST /api/wallets/*` |
| Watchlist | `GET/POST/DELETE /api/watchlist` |
| Telegram | `GET/POST /api/telegram/*` |
| Resolver | `GET /api/resolve` |
| Market | `GET /api/market/flow-anomalies` |

---

## 🗓 Roadmap

### Phase B2 - Wallet → Token Correlation (Next)
**Goal**: "This token moves because of WHO?"

- [ ] Wallet influence scoring for tokens
- [ ] Participation tracking (buyCount, sellCount, netVolume)
- [ ] Timing analysis (before/after moves)
- [ ] UI: "Who's behind the activity?" section

### Phase B3 - Wallet Clusters (Backlog)
**Goal**: "One actor = many addresses"

- [ ] Behavioral clustering algorithm
- [ ] Attribution confidence
- [ ] Entity enrichment
- [ ] Related wallets UI

### Phase B4 - Smart Money Patterns (Backlog)
**Goal**: "Should I trust this wallet?"

- [ ] Historical ROI tracking
- [ ] Accuracy scoring
- [ ] Pattern recognition
- [ ] Smart money badge in UI

### P2 - Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-chain | Arbitrum, BNB support | Medium |
| Token Tabs | Overview, Flows, Holders | Medium |
| Signal Explanations | "Why was this detected?" | Low |
| Telegram Mute | "Mute for 24h" button | Medium |
| Production Infra | Nginx, Redis, monitoring | Medium |

---

## 🐛 Known Issues

| Issue | Severity | Workaround |
|-------|----------|------------|
| Mongoose duplicate index warnings | Low | Ignore, non-blocking |
| ERC20 indexer RPC limits | Medium | Retry logic in place |
| WebSocket reconnect on mobile | Low | Backoff implemented |

---

## 📏 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Alert creation success rate | >99% | ✅ |
| API response time (p95) | <500ms | ✅ |
| Telegram delivery rate | >98% | TBD |
| UI error rate | <1% | ✅ |
| Alert noise reduction | 80% | ✅ (Phase A) |

---

## 📝 Architecture Notes

### Phase A Principles
1. **GroupKey = scope + targetId + signalType** (NOT severity, NOT time)
2. **Severity decay** prevents eternal groups
3. **Rate limiting** prevents spam (user + group level)
4. **Lifecycle reasons evolve**: "started" → "continues" → "slowing" → "ended"

### Phase B1 Principles
1. **Profiles are snapshots**, not real-time (refresh periodically)
2. **Tags are derived**, not asserted
3. **Confidence reflects data quality**
4. **Summary is human-readable explanation**

### Security Considerations
- Current: `x-user-id` header (demo mode)
- Production: Implement JWT/OAuth
- Telegram: Verification codes for linking

---

*Document maintained by BlockView team*
