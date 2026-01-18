# BlockView Roadmap

## Current Version: 3.2.0

---

## ✅ Completed (v3.2.0)

### Live Analytics Engine
- [x] ERC20 Transfer indexer with Infura + Ankr RPC
- [x] Real-time blockchain data pipeline
- [x] Activity Snapshot with live metrics

### P0: Signals Generation
- [x] Activity spike detection (deviation from 7-day baseline)
- [x] Large move detection (exceeds P99)
- [x] Accumulation/Distribution patterns
- [x] Evidence-based explanations

### P1: Analytics Blocks (B2/B3/B4)
- [x] Activity Drivers - "Who is driving this token?"
- [x] Wallet Clusters - "Coordinated addresses"
- [x] Smart Money Patterns - "Accumulators vs Distributors"

### Alert System
- [x] Insight-first alert creation
- [x] Telegram notifications
- [x] Watchlist integration

---

## 🟡 In Progress (P2)

### Price Oracle Integration
- [ ] CoinGecko API for real-time prices
- [ ] Support non-stablecoin Net Flow (WETH, WBTC, etc.)
- [ ] 5-minute price cache
- [ ] Chainlink fallback for critical assets

### UX Improvements
- [ ] Confidence Score tooltip
- [ ] Metric definition tooltips
- [ ] Loading state improvements

---

## 🟠 Upcoming (P3)

### Advanced Alert Parameters
- [ ] Custom threshold windows
- [ ] Direction filter (inflow/outflow)
- [ ] Minimum transfer size
- [ ] Alert feedback loop

### WalletsPage Analytics
- [ ] Wallet Activity Drivers
- [ ] Cross-token correlation
- [ ] Historical performance charts

---

## 🔵 Future (P4+)

### Multi-Chain Support
- [ ] Arbitrum
- [ ] BNB Chain
- [ ] Base
- [ ] Polygon

### Production Infrastructure
- [ ] Nginx reverse proxy
- [ ] Redis caching
- [ ] Prometheus metrics
- [ ] Grafana dashboards

### Advanced Features
- [ ] Telegram mute function
- [ ] Email notifications
- [ ] API rate limiting
- [ ] User authentication (JWT)

---

## 📊 Metrics & Goals

| Metric | Current | Target |
|--------|---------|--------|
| Supported Chains | 1 (Ethereum) | 4+ |
| Signal Types | 4 | 8+ |
| API Response Time | <500ms | <200ms |
| Data Freshness | ~5 min | <1 min |

---

## 🔄 Release Schedule

| Version | Focus | ETA |
|---------|-------|-----|
| 3.2.0 | Live Analytics Engine | ✅ Released |
| 3.3.0 | Price Oracle + Non-stablecoin Flow | Next |
| 3.4.0 | Advanced Alerts | TBD |
| 4.0.0 | Multi-chain Support | TBD |

---

*Updated: 2026-01-18*
