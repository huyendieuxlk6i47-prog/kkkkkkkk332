# BlockView — Product Requirements Document

## 📋 Overview

**Product**: BlockView - Blockchain Analytics Platform  
**Version**: 3.4.0  
**Last Updated**: 2026-01-18 (P0-P2 Complete)

### Vision
Transform on-chain data from passive reference into actionable intelligence through smart alerts and wallet behavior analysis.

### Core Principles
```
Tokens without Alerts = справочник (reference)
Tokens with Alerts = инструмент (tool)
Smart Alerts = "не 10 спам-сообщений, а одна понятная история"
Wallet Profiles = "кто это? Трейдер? Фонд? Кит?"
Empty Result = "Мы проверили X, Y, Z → результат пуст" (не ошибка!)
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

## ✅ Implemented Features (v3.2.0)

### Core Data Pipeline ✅
- [x] ERC20 Transfer indexer (Infura + Ankr RPC with load balancing)
- [x] Real-time blockchain data ingestion
- [x] MongoDB storage (logs_erc20, transfers, sync_states)
- [x] Background jobs for continuous indexing

### P0: Signals Generation ✅ COMPLETE (2026-01-18)
**Goal**: Generate trading signals based on baseline deviation

| Feature | Status |
|---------|--------|
| Backend service (token_signals.service.ts) | ✅ |
| API: GET /api/market/token-signals/:tokenAddress | ✅ |
| Signal: activity_spike (deviation from 7-day baseline) | ✅ |
| Signal: large_move (exceeds P99 transfer size) | ✅ |
| Signal: accumulation (top 3 wallets > 70% receiving) | ✅ |
| Signal: distribution (top 3 wallets > 70% sending) | ✅ |
| Evidence structure: metric, baseline, current, deviation | ✅ |
| Frontend: TokenSignalsBlock with live data | ✅ |

**Live Verification**: USDT shows "Activity Spike 104.8x from baseline"

### P1: Activity Drivers (B2) ✅ COMPLETE (2026-01-18)
**Goal**: "This token moves because of WHO?"

| Feature | Status |
|---------|--------|
| Backend: getActivityDrivers() | ✅ |
| API: GET /api/market/token-drivers/:tokenAddress | ✅ |
| Metrics: influence %, volume in/out, net flow USD | ✅ |
| Role classification: accumulator/distributor/mixed | ✅ |
| UI: TokenActivityDrivers component | ✅ |
| Concentration detection (top 3 > 50%) | ✅ |

**Live Verification**: Top wallet 33% influence, $258M+ volume

### P1: Wallet Clusters (B3) ✅ COMPLETE (2026-01-18)
**Goal**: "One actor = many addresses"

| Feature | Status |
|---------|--------|
| API: GET /api/market/token-clusters/:tokenAddress | ✅ |
| Block co-occurrence detection | ✅ |
| Cluster confidence scoring | ✅ |
| UI: TokenClusters component | ✅ |

**Live Verification**: 3 clusters detected, 90% confidence

### P1: Smart Money Patterns (B4) ✅ COMPLETE (2026-01-18)
**Goal**: "Should I trust this wallet?"

| Feature | Status |
|---------|--------|
| API: GET /api/market/token-smart-money/:tokenAddress | ✅ |
| Accumulator/Distributor identification | ✅ |
| Volume-based ranking | ✅ |
| UI: TokenSmartMoney component | ✅ |

**Live Verification**: $43.7B smart money volume tracked

### Activity Snapshot ✅ COMPLETE
| Metric | Definition | Status |
|--------|------------|--------|
| Transfers 24h | Count of ERC20 Transfer events | ✅ |
| Active Wallets | unique(senders) ∪ unique(receivers) | ✅ |
| Largest Transfer | max(transfer_amount) in USD | ✅ Fixed |
| Net Flow | sum(accumulator_inflows) - sum(distributor_outflows) | ✅ Fixed |
| Total Volume | sum(all_transfers) in USD | ✅ |
| Direction | inflow / outflow / neutral | ✅ |

### Alert System ✅ COMPLETE
- [x] AlertRule ↔ WatchlistItem coupling
- [x] Signal types: accumulation, distribution, large_move, smart_money_entry, activity_spike
- [x] Multi-channel: In-App + Telegram
- [x] CRUD operations via API
- [x] Insight-first alert creation modal
- [x] Sensitivity selector (Low/Medium/High)
- [x] Notification preview

### Market Discovery ✅ COMPLETE
- [x] GET /api/market/top-active-tokens
- [x] Top tokens by transfer count
- [x] Active wallet counts
- [x] Market Page with discovery + watchlist

### UI Interpretation Layer ✅ COMPLETE
- [x] All blocks show "Checked" badge with analysis explanation
- [x] Empty states explain WHAT was checked
- [x] Human-readable metric definitions
- [x] Resolution Status without confidence-based messaging

### ✅ P1: WalletsPage Synchronization - COMPLETE (2026-01-18)
**Goal**: Bring WalletsPage to feature parity with TokensPage semantic layer

| Task | Priority | Status |
|------|----------|--------|
| WalletActivitySnapshot uses /api/wallets/:address/activity-snapshot | P1 | ✅ DONE |
| WalletSignalsBlock uses /api/wallets/:address/signals | P1 | ✅ DONE |
| RelatedAddresses uses /api/wallets/:address/related | P1 | ✅ DONE |
| SmartMoneyProfile uses /api/wallets/:address/performance | P1 | ✅ DONE |
| All components show "Checked" badge with interpretation | P1 | ✅ DONE |
| Empty states explain what was analyzed | P1 | ✅ DONE |

### ✅ P2: MarketPage Discovery Layer - COMPLETE (2026-01-18)
**Goal**: Transform MarketPage into true discovery tool

| Task | Priority | Status |
|------|----------|--------|
| Top Active Tokens card (live 24h data) | P2 | ✅ DONE |
| Emerging Signals card via /api/market/emerging-signals | P2 | ✅ DONE |
| New Actors card via /api/market/new-actors | P2 | ✅ DONE |
| CTA to add items to watchlist | P2 | ✅ DONE |
| 3-column responsive grid layout | P2 | ✅ DONE |

---

## 🗓 Roadmap

### ✅ P2: Price Oracle Integration - COMPLETE (2026-01-18)
**Goal**: Calculate Net Flow for non-stablecoins

| Task | Priority | Status |
|------|----------|--------|
| CoinGecko API integration | P2 | ✅ DONE |
| In-memory cache (5min TTL) | P2 | ✅ DONE |
| Support WETH, WBTC, LINK, UNI, AAVE, SUSHI, MKR, CRV, etc. | P2 | ✅ DONE |
| priceSource field in API response | P2 | ✅ DONE |
| priceNote explanation in interpretation | P2 | ✅ DONE |

**Live Results**:
- WETH: $3,351.82 (coingecko)
- LINK: $13.83 (coingecko)  
- UNI: $5.37 (coingecko)
- USDT/USDC/DAI: $1 (stablecoin)

### ✅ P2: UX Improvements - COMPLETE (2026-01-18)

| Task | Priority | Status |
|------|----------|--------|
| Confidence Score tooltip explanation | P2 | ✅ DONE |
| "Data reflects completeness, not signal quality" | P2 | ✅ DONE |
| Contributing factors list | P2 | ✅ DONE |

### ✅ P3: Advanced Alert Parameters - COMPLETE (2026-01-18)

| Task | Priority | Status |
|------|----------|--------|
| Collapsible Advanced Parameters section | P3 | ✅ DONE |
| Custom time windows (1h/6h/24h/7d) | P3 | ✅ DONE |
| Direction filter (inflow/outflow/both) | P3 | ✅ DONE |
| Minimum transfer size filter (USD) | P3 | ✅ DONE |
| Notification cooldown selector | P3 | ✅ DONE |

### 🔵 Future: Multi-Chain Support

| Chain | Priority | Status |
|-------|----------|--------|
| Arbitrum | P4 | TODO |
| BNB Chain | P4 | TODO |
| Base | P4 | TODO |

### 🔵 Future: Production Infrastructure

| Task | Priority | Status |
|------|----------|--------|
| Nginx reverse proxy | P4 | TODO |
| Redis caching layer | P4 | TODO |
| Monitoring (Prometheus + Grafana) | P4 | TODO |
| Telegram mute function | P4 | TODO |

---

## 📊 Technical Architecture

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Tailwind CSS + Shadcn/UI |
| Backend | TypeScript + Fastify |
| Database | MongoDB 6.0 + Mongoose |
| Blockchain | ethers.js + Infura + Ankr RPC |
| Notifications | Telegram Bot API |

### Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| GET /api/market/token-activity/:address | Live activity metrics |
| GET /api/market/token-signals/:address | Generated trading signals |
| GET /api/market/token-drivers/:address | Top wallets driving activity |
| GET /api/market/token-clusters/:address | Coordinated wallet clusters |
| GET /api/market/token-smart-money/:address | Smart money patterns |
| GET /api/market/top-active-tokens | Market discovery |
| POST /api/alerts/rules | Create alert rule |
| GET /api/watchlist | User's tracked items |

### Data Models

#### logs_erc20 (Raw indexed data)
```typescript
{
  txHash: string,
  logIndex: number,
  blockNumber: number,
  blockTimestamp: Date,
  token: string,
  from: string,
  to: string,
  amount: string
}
```

#### TokenSignal
```typescript
{
  type: 'activity_spike' | 'large_move' | 'accumulation' | 'distribution',
  severity: number, // 0-100
  confidence: number, // 0-1
  title: string,
  description: string,
  evidence: {
    metric: string,
    baseline: number,
    current: number,
    deviation: number
  },
  timestamp: Date
}
```

---

## 🐛 Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| WebSocket 403 reconnection loop | Low | Known, non-blocking |
| Mongoose duplicate index warnings | Low | Ignore |
| Platform Ingress blocks webhooks | Medium | Polling workaround |

---

## 📏 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Signal generation accuracy | >80% | ✅ |
| API response time (p95) | <500ms | ✅ |
| Data freshness | <5 min | ✅ |
| UI error rate | <1% | ✅ |
| Test coverage | >90% | ✅ 100% |

---

## 🔗 Related Documents

- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [test_reports/](./test_reports/) - Test results

---

*Last updated: 2026-01-18 by BlockView Team*
