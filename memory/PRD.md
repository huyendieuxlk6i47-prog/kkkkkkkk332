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

### Phase B2 - Wallet → Token Correlation ✅ SKELETON COMPLETE
**Goal**: "This token moves because of WHO?"

- [x] Backend engine skeleton (wallet_token_correlation.engine.ts)
- [x] API endpoint: GET /api/tokens/:address/drivers
- [x] UI: TokenActivityDrivers component
- [ ] Full algorithm implementation (placeholder)

### Phase B3 - Wallet Clusters ✅ SKELETON COMPLETE
**Goal**: "One actor = many addresses"

- [x] Backend schema and model (wallet_cluster.engine.ts)
- [x] API endpoint: GET /api/wallets/:address/clusters
- [x] UI: RelatedAddresses component
- [ ] Full clustering algorithm (placeholder)

### Phase B4 - Smart Money Patterns ✅ SKELETON COMPLETE
**Goal**: "Should I trust this wallet?"

- [x] Backend schema and model (smart_money_profile.engine.ts)
- [x] API endpoint: GET /api/wallets/:address/smart-profile
- [x] UI: SmartMoneyProfile component
- [ ] Full pattern recognition algorithm (placeholder)

### 🔧 Bug Fixes Completed (2026-01-18)

**P0 - Wallet Watchlist + Alerts ✅ FIXED**
- Fixed CreateWalletAlertModal.jsx to use correct backend trigger types
- Valid triggers: accumulation, distribution, large_move, smart_money_entry, activity_spike
- Integrated TrackWalletButton into WalletsPage.jsx
- Wallet alerts can now be created from UI

**P1 - Legacy Indexing Logic Cleanup ✅ FIXED**
- Removed "confidence < 0.4 = indexing" logic
- Low confidence now shows "Limited activity" message (not "Indexing")
- Backend status is now the single source of truth
- Fixed in: DataAvailability.jsx, ActorProfile.jsx

**UX Polish - Human-Friendly Language ✅ COMPLETE (2026-01-18)**
- Replaced all "Indexing" terminology with "Analyzing" across UI
- Updated empty states with clearer descriptions
- Fixed Loading states: "Looking up wallet...", "Gathering activity data"
- Updated hints: "You can leave this page — analysis continues in background"
- Improved confidence messaging: "Limited on-chain activity" vs "Low confidence"
- Files updated: IndexingState.jsx, WalletsPage.jsx, TokensPage.jsx, ActorProfile.jsx, ArkhamHome.jsx, SignalsPage.jsx, EntitiesPage.jsx, DataAvailability.jsx

**P3 - Interpretation & Metrics Layer ✅ COMPLETE (2026-01-18)**
TokensPage UI contract implementation - "ничего нет" → "мы проверили X, Y, Z → результат пуст"

| Section | Component | Status |
|---------|-----------|--------|
| Section 1 | Token Header | ✅ Added RESOLVED badge, Chain info |
| Section 2 | Activity Snapshot | ✅ NEW - Net Flow, Wallets, Transfers, Window + interpretation |
| Section 3 | Who is driving (B2) | ✅ Enhanced empty state with volume distribution explanation |
| Section 4 | Token Activity | ✅ Added "Checked" badge + explanation |
| Section 5 | Recent Signals | ✅ "Checked" badge + signal types tracked |
| Section 6 | Related Clusters (B3) | ✅ "Checked" badge + correlation analysis explanation |
| Section 7 | Smart Money (B4) | ✅ "Checked" badge + profitable wallets explanation |
| Section 8 | Resolution Status | ✅ Removed confidence-based messaging |

**Key Changes:**
- Created ActivitySnapshot.jsx component with baseline metrics grid
- All blocks show "Checked" badge when analysis complete
- Empty states explain WHAT was checked, not just "no data"
- Removed all confidence-based UI gating
- Added interpretation footers to all blocks

**P2.2 - WalletsPage Interpretation Layer ✅ COMPLETE (2026-01-18)**
WalletsPage UI contract implementation - same principle as TokensPage

| Section | Component | Status |
|---------|-----------|--------|
| Section 1 | Wallet Header (B1) | ✅ Type badge (Unknown/EOA/Contract), Chain badge, Resolved badge, Tags |
| Section 2 | Wallet Activity Snapshot | ✅ NEW - Inflow, Outflow, Net Flow, Transfers, Active Tokens, Window + interpretation |
| Section 3 | Behavior Summary (B1) | ✅ Pattern label + "Checked" badge + explanation |
| Section 4 | Related Addresses (B3) | ✅ "Checked" badge + timing/token/behavioral correlation explanation |
| Section 5 | Historical Performance (B4) | ✅ "Checked" badge + "honest assessment" explanation |
| Section 6 | Recent Signals | ✅ "Checked" badge + accumulation/distribution/transfers explanation |
| Section 7 | Resolution Status | ✅ Removed misleading "indexing" and confidence-based messaging |

**Key Changes:**
- Created WalletActivitySnapshot.jsx component with 6-metric grid
- Updated RelatedAddresses.jsx with proper "Checked" badge and analysis explanation
- Updated SmartMoneyProfile.jsx with "honest assessment" messaging
- All blocks show "Checked" badge when analysis complete
- Empty states explain WHAT was checked using timing correlation, token overlap, behavioral similarity
- Resolution Status shows only factual info: Type, Chain, Status

### P2 - Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| MarketPage Implementation | Connect to Watchlist and Alerts | P1 |
| Confidence Score Explanation | Tooltip explaining data completeness | P2 |
| Advanced Alert Parameters UI | Tuning thresholds for alerts | P3 |
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
