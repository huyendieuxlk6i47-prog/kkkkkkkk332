# BlockView Changelog

## [3.2.0] - 2026-01-18

### 🚀 Major Features: Live Blockchain Analytics Engine

This release connects the entire analytics platform to live on-chain data, transforming BlockView from a prototype into a functional blockchain intelligence tool.

---

### ✅ P0: Signals Generation - COMPLETE

**Goal**: Generate trading signals based on deviation from baseline activity

- **Backend**: `token_signals.service.ts` - `generateTokenSignals()`
- **API**: `GET /api/market/token-signals/:tokenAddress`
- **Signal Types**:
  - `activity_spike` - Transfer activity significantly above 7-day average
  - `large_move` - Single transfer exceeding P99 threshold
  - `accumulation` - High concentration of receiving (top 3 wallets > 70%)
  - `distribution` - High concentration of sending (top 3 wallets > 70%)
- **Baseline**: 7-day rolling average (168 hours)
- **Evidence Structure**: `{ metric, baseline, current, deviation }`
- **Live Result**: USDT shows "Activity Spike 104.8x from baseline"

---

### ✅ P1: Activity Drivers (B2) - COMPLETE

**Goal**: "This token moves because of WHO?"

- **Backend**: `token_signals.service.ts` - `getActivityDrivers()`
- **API**: `GET /api/market/token-drivers/:tokenAddress`
- **Metrics**:
  - Wallet address
  - Role: `accumulator` | `distributor` | `mixed`
  - Influence score (% of total volume)
  - Volume in/out (raw + USD)
  - Net flow (USD)
- **UI**: `TokenActivityDrivers.jsx` - Top 3 wallets with influence breakdown
- **Live Result**: Top wallet 33% influence, $258M+ total volume

---

### ✅ P1: Wallet Clusters (B3) - COMPLETE

**Goal**: "One actor = many addresses"

- **API**: `GET /api/market/token-clusters/:tokenAddress`
- **Detection**: Block co-occurrence analysis
- **Metrics**: Cluster ID, wallet count, behavior pattern, confidence
- **UI**: `TokenClusters.jsx` - Shows coordinated wallet groups
- **Live Result**: 3 clusters detected with 90% confidence

---

### ✅ P1: Smart Money Patterns (B4) - COMPLETE

**Goal**: "Should I trust this wallet?"

- **API**: `GET /api/market/token-smart-money/:tokenAddress`
- **Detection**: Volume-based accumulator/distributor identification
- **Metrics**: Wallet, action type, volume USD
- **UI**: `TokenSmartMoney.jsx` - Accumulators vs Distributors
- **Live Result**: $43.7B total smart money volume

---

### 🔧 Critical Bug Fixes

#### Largest Transfer - MongoDB Sorting Fix
- **Problem**: Showed $10K instead of $21.9M
- **Cause**: MongoDB sorted string field lexicographically ("10000" > "9999999")
- **Fix**: Convert to number before sorting with `$toDouble` + aggregation pipeline
- **Result**: Now correctly shows $21,932,420

#### Net Flow - Semantic Fix
- **Problem**: Showed $260M (total volume) with no direction
- **Cause**: Was calculating `sum(all transfers)` instead of actual net flow
- **Fix**: `netFlow = sum(accumulator_inflows) - sum(distributor_outflows)`
- **Result**: Now shows `-$2.4M (outflow)` with direction indicator

#### Active Wallets - Definition Clarity
- **Problem**: Unclear what "active wallets" means
- **Fix**: Added `interpretation.walletsDefinition: "unique senders ∪ receivers"`
- **Result**: API now self-documents metric definitions

#### ERC20 Indexer - Crash Fix
- **Problem**: `Cannot read properties of undefined (reading 'slice')`
- **Cause**: Some logs have missing/malformed `topics` array
- **Fix**: Validate `log.topics?.length >= 3` before parsing
- **Result**: Indexer continues processing without crashes

---

### 📊 API Response Structure Updates

#### GET /api/market/token-activity/:tokenAddress

```json
{
  "ok": true,
  "data": {
    "tokenAddress": "0xdac17f...",
    "window": "24h",
    "activity": {
      "transfers24h": 54600,
      "activeWallets": 26883,
      "largestTransfer": 21932419.87
    },
    "flows": {
      "totalVolume": 260789101.00,
      "netFlow": -2409271.52,
      "direction": "outflow",
      "hasPrice": true
    },
    "interpretation": {
      "walletsDefinition": "unique senders ∪ receivers",
      "netFlowDefinition": "sum(accumulator_inflows) - sum(distributor_outflows)"
    },
    "dataSource": "indexed_transfers"
  }
}
```

---

### 🧪 Testing

- **Backend Tests**: 28/28 passed (100%)
- **Test File**: `/app/tests/test_token_signals_drivers.py`
- **Covered APIs**:
  - Token Signals (5 tests)
  - Token Drivers (5 tests)
  - Token Activity (5 tests)
  - Token Clusters (4 tests)
  - Token Smart Money (3 tests)
  - Top Active Tokens (4 tests)

---

### 📁 Files Changed

#### Backend
- `backend/src/core/market/market.routes.ts` - Fixed aggregation queries
- `backend/src/core/market/token_signals.service.ts` - Signal generation logic
- `backend/src/onchain/ethereum/erc20.indexer.ts` - Crash fix for malformed logs

#### Frontend
- `frontend/src/components/ActivitySnapshot.jsx` - Updated for new flow structure
- `frontend/src/components/TokenActivityDrivers.jsx` - API transform for new endpoint
- `frontend/src/pages/TokensPage.jsx` - Removed duplicate TokenActivityBlock
- `frontend/src/api/wallets.api.js` - Updated endpoint path

---

## [3.1.0] - 2026-01-17

### Previous Release
- Connected ERC20 indexer to live blockchain via Infura + Ankr RPC
- Implemented Activity Snapshot with live metrics
- Created Market Discovery page with top active tokens
- Redesigned Alert UX (A1-A3) with insight-first approach
- Implemented UI Interpretation Layer for empty states
