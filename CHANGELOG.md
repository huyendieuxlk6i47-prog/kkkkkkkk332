# Changelog

All notable changes to BlockView are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-01-17

### Added

#### Phase A: Alert Intelligence Layer (Complete)
Smart alerts that group behavior, not spam events.

- **A0 - Event Normalization**
  - Standardizes all signal types to `NormalizedAlertEvent`
  - Extracts metrics: value, threshold, baseline, deviation
  - Calculates confidence scores
  - Location: `/backend/src/core/alerts/normalization/`

- **A1 - Deduplication Engine**
  - Answers: "Is this new or repeated behavior?"
  - Uses `dedupKey = hash(signalType + scope + targetId + direction + thresholdBucket)`
  - Tracks occurrence counts and time windows
  - Location: `/backend/src/core/alerts/deduplication/`

- **A2 - Severity & Priority Engine**
  - Answers: "How important is this event?"
  - Formula: `severityScore = magnitudeScore * confidenceMultiplier * noveltyMultiplier + persistenceBonus`
  - Priority levels: low, medium, high
  - Human-readable reasons
  - Location: `/backend/src/core/alerts/severity/`

- **A3 - Grouping Engine**
  - Answers: "Is this ongoing behavior?"
  - GroupKey = `scope + targetId + signalType` (NOT severity, NOT time)
  - Lifecycle: `active` → `cooling` → `resolved`
  - Severity decay over time (1h: 0.9, 3h: 0.7, 6h: 0.4, 12h: 0.2)
  - Evolving reasons: "started" → "continues" → "slowing" → "ended"
  - Location: `/backend/src/core/alerts/grouping/`

- **A4 - Dispatcher Engine**
  - Answers: "When, where, and to whom to notify?"
  - Decision matrix: new → escalation → cooling → resolved
  - User preferences: minPriority, channels, notifyOn settings
  - Rate limiting: per-user (10/hour), per-group (15min interval)
  - Channels: UI + Telegram (no email)
  - Silent updates for ongoing behavior
  - Location: `/backend/src/core/alerts/dispatcher/`

- **Unified Alert Pipeline**
  - Single entry point: `alertPipeline.process(signal, ruleId, userId)`
  - Returns: normalized → deduped → scored → grouped → dispatched
  - Maintenance job for lifecycle transitions
  - Location: `/backend/src/core/alerts/alert.pipeline.ts`

#### Phase B1: Wallet Profile (Foundation)
Answer: "Who is this wallet?"

- **Wallet Profile Engine**
  - Behavioral tags: active, dormant, new, high-volume, whale, trader, holder, flipper, degen, bridge-user, etc.
  - Activity metrics: firstSeen, lastSeen, activeDays, txCount
  - Flow metrics: totalIn, totalOut, netFlow, avgTxSize
  - Behavior analysis: dominantAction, burstinessScore, diversificationScore
  - Token interactions: top tokens by volume
  - Confidence scoring based on data quality
  - Human-readable summaries
  - Location: `/backend/src/core/wallets/`

- **Wallet API Endpoints**
  - `GET /api/wallets/:address` - Get wallet profile
  - `POST /api/wallets/profile` - Build/refresh profile
  - `GET /api/wallets/search?tags=` - Search by tags
  - `GET /api/wallets/high-volume` - High-volume wallets
  - `GET /api/wallets/tags` - Available tags

- **WalletProfileCard Component**
  - Displays profile with headline, description, tags
  - Activity metrics visualization
  - Top tokens with buy/sell volumes
  - Confidence indicator
  - Tooltips explaining each tag
  - Location: `/frontend/src/components/WalletProfileCard.jsx`

### Changed
- README.md updated with Phase A and B1 documentation
- Architecture diagrams updated
- API reference expanded

---

## [2.1.0] - 2026-01-17

### Added
- **Alert System Complete (P0)**
  - Full CRUD for alert rules (`POST/GET/PUT/DELETE /api/alerts/rules`)
  - Alert-Watchlist integration: AlertRule MUST be linked to WatchlistItem
  - Auto-creation of WatchlistItem when creating AlertRule
  - Multi-channel notifications: In-App + Telegram
  
- **Telegram Integration**
  - Bot: @FOMO_a_bot
  - Commands: `/start`, `/status`, `/disconnect`, `/help`
  - Webhook-based message delivery
  - User connection flow with verification codes

- **Alert Management UI (P1)**
  - AlertsPage with rules list
  - Filter tabs: All / Active / Paused
  - Pause/Resume buttons
  - Delete functionality
  - Stats display: Total / Active / Paused

- **CreateAlertModal Enhancements (P1)**
  - Target Context Box: token name, chain, address, confidence
  - Summary section before submit
  - 5 signal types with descriptions
  - Notification channel selection

- **Backend Improvements**
  - `targetType` field added to AlertRule model
  - Watchlist API returns `alertCount` per item
  - `lastTriggeredAt` tracking on rules

### Fixed
- ESM import errors for TypeScript interfaces (use `import type`)
- MONGODB_URI pointing to wrong database (test_database → blockview)
- `z.coerce.boolean()` parsing "false" string as true
- AlertsPage showing empty list due to query filter bug

### Changed
- AlertRule schema now requires `watchlistItemId`
- CreateAlertModal layout with better UX
- AlertsPage shows rules (not events)

---

## [2.0.0] - 2026-01-16

### Added
- **Production Hardening (Option B)**
  - B0-B6: Health checks, metrics, event logs, locks, heartbeats
  - Honest UI states: Real / Indexing / Disabled
  
- **Market Page Hardening**
  - Asset Selector with ETH primary support
  - Flow Anomalies connected to real backend API
  - Z-score based anomaly detection

- **Tokens Page Complete (P0/P1/P2)**
  - 3 states: Entry → Indexing → Resolved
  - Universal resolver with ENS support
  - Token Activity block
  - Token Signals with confidence gating
  - Token Seeds for known tokens (USDT, USDC, etc.)

### Changed
- Migrated from mock data to real blockchain data
- Confidence threshold for data display (0.6 minimum)

---

## [1.0.0] - 2025-06

### Added
- Initial release
- React frontend with Tailwind CSS
- Fastify backend with TypeScript
- MongoDB integration
- WebSocket real-time updates
- Basic wallet tracking
- Signal detection framework

---

## Migration Notes

### v2.0.0 → v2.1.0

**Database Changes:**
```javascript
// Add targetType to existing alert_rules
db.alert_rules.updateMany(
  { targetType: { $exists: false } },
  { $set: { targetType: 'token' } }
);

// Remove rules without watchlistItemId (invalid after v2.1.0)
db.alert_rules.deleteMany({
  watchlistItemId: { $exists: false }
});
```

**Environment:**
- Ensure `TELEGRAM_BOT_TOKEN` is set
- Ensure `MONGODB_URI` points to `blockview` database

---

## Unreleased

### Planned for v2.2.0
- Advanced Alert Conditions UI
  - Threshold input (≥ X tokens)
  - Direction selector (in/out)
  - Time window (1h / 6h / 24h)
- WatchlistPage backend integration
- Alert Edit modal
