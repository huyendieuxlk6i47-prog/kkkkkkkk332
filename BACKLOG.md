# BlockView - Feature Backlog

## ✅ Phase A: Alert Intelligence Layer (COMPLETE)

**Status**: ✅ Complete  
**Completion Date**: 2026-01-17

| Layer | Purpose | Status |
|-------|---------|--------|
| A0 - Normalization | Standardize signal format | ✅ |
| A1 - Deduplication | "New or repeated?" | ✅ |
| A2 - Severity | "How important?" | ✅ |
| A3 - Grouping | Behavior lifecycle | ✅ |
| A4 - Dispatcher | When/where to notify | ✅ |

**Key Files:**
- `/backend/src/core/alerts/alert.pipeline.ts` - Unified pipeline
- `/backend/src/core/alerts/normalization/` - A0
- `/backend/src/core/alerts/deduplication/` - A1
- `/backend/src/core/alerts/severity/` - A2
- `/backend/src/core/alerts/grouping/` - A3
- `/backend/src/core/alerts/dispatcher/` - A4

---

## ✅ Phase B1: Wallet Profile (COMPLETE)

**Status**: ✅ Complete  
**Completion Date**: 2026-01-17

**What was done:**
- Wallet profile engine with behavioral tags
- Activity, flow, and behavior metrics
- Token interactions tracking
- Confidence scoring
- Human-readable summaries
- API endpoints for CRUD
- WalletProfileCard UI component

**Key Files:**
- `/backend/src/core/wallets/wallet_profile.engine.ts`
- `/backend/src/core/wallets/wallet.routes.ts`
- `/frontend/src/components/WalletProfileCard.jsx`
- `/frontend/src/api/wallets.api.js`

---

## ✅ Phase B2: Wallet → Token Correlation (COMPLETE)

**Status**: ✅ Complete  
**Completion Date**: 2026-01-17

**Goal**: Answer "This token moves because of WHO?"

**What was done:**
- WalletTokenCorrelation engine with influenceScore calculation
- Volume share, activity frequency, timing weight metrics
- Role classification (buyer/seller/mixed)
- Time relation analysis (before_signal/during_signal/after_signal)
- AlertGroupDrivers - links drivers to alerts
- TokenActivityDrivers UI component
- AlertDriversBadge component for alert cards
- API endpoints for token drivers and alert group drivers

**Key Files:**
- `/backend/src/core/wallets/wallet_token_correlation.schema.ts`
- `/backend/src/core/wallets/wallet_token_correlation.model.ts`
- `/backend/src/core/wallets/wallet_token_correlation.engine.ts`
- `/backend/src/core/wallets/wallet.routes.ts` (updated with B2 routes)
- `/frontend/src/components/TokenActivityDrivers.jsx`
- `/frontend/src/components/AlertDriversBadge.jsx`
- `/frontend/src/api/wallets.api.js` (updated with B2 APIs)
- `/frontend/src/pages/TokensPage.jsx` (integrated TokenActivityDrivers)

**API Endpoints:**
- `GET /api/tokens/:address/drivers` - Get wallets driving token activity
- `POST /api/tokens/:address/drivers/calculate` - Trigger fresh calculation
- `GET /api/wallets/:address/token-influence` - Get tokens where wallet has influence
- `GET /api/alerts/groups/:groupId/drivers` - Get drivers for alert group
- `POST /api/alerts/groups/:groupId/drivers/link` - Link drivers to alert

---

## 📋 Phase B3: Wallet Clusters (BACKLOG)

**Status**: 📋 Backlog  
**Priority**: P2

**Goal**: "One actor = many addresses"

**To implement:**
```typescript
WalletCluster {
  clusterId: string
  wallets: string[]
  confidence: number
  reason: string[]  // 'shared timing', 'similar tokens', 'bridge pattern'
}
```

**UI:**
- "Related wallets detected" on Wallet Page
- Confidence badges: confirmed / suspected
- WHY explanation

---

## 📋 Phase B4: Smart Money Patterns (BACKLOG)

**Status**: 📋 Backlog  
**Priority**: P2

**Goal**: "Should I trust this wallet?"

**To implement:**
```typescript
SmartMoneyPattern {
  walletCluster: string
  historicalROI: number
  accuracy: number
  confidence: number
}
```

**UI:**
- Badge: "Smart Wallet - Historically profitable"
- Used in Alerts, Tokens, Narratives

---

## ✅ C - UI/UX Finalization (Production Feel)

### C1 - Unified Card System ✅ COMPLETE + CLEAN
### C2 - Navigation & Mental Model ✅ COMPLETE
### C3 - Product Narrative ✅ IN PROGRESS

**Status**: 🔵 C3.A Complete | C3.B & C3.C Ready  
**Priority**: P1 (Critical for perceived value)

---

## ✅ C3.A - Language Unification (COMPLETED)

**What was done:**

1. **Created Product Copy Map**
   - `/app/PRODUCT_COPY_MAP.md` - comprehensive guide
   - Signal types with product-friendly labels
   - Action framing (decisions, not buttons)
   - Tone guidelines established

2. **Applied to AlertsPage:**
   - ✅ Signal badges: "Consistent buying" vs "Accumulation"
   - ✅ Tooltips: explanations WHY signal matters
   - ✅ Actions: "Monitor Behavior" vs "New Alert"
   - ✅ Timestamps: "Last observed" vs "Triggered"
   - ✅ Status: "Pause/Resume monitoring" vs "Pause/Resume"

3. **Applied to WatchlistPage:**
   - ✅ Button: "Track Activity" vs "Add"
   - ✅ Empty state: clearer value prop
   - ✅ Subtitle: "Monitoring overview"

**Result:**
- Backend terms NEVER shown directly to user ✅
- Every label has context/explanation ✅
- Product-focused language throughout ✅

---

## 🔜 C3.B - Insight-first Copy (Next)

**Goal**: Every block answers "WHY this matters"

**To implement:**
- Signal cards with context
- Flow anomaly explanations
- Smart money activity insights
- Market overview narrative

**Pattern:**
```
❌ "Accumulation detected"
✅ "Consistent buying activity — large wallets 
   are accumulating this token"
```

---

## 🔜 C3.C - Action Framing (Next)

**Goal**: Actions = decisions, not technical operations

**Current state**: Some done in C3.A
**Remaining:**
- Modal titles
- Confirmation messages
- Success/error states

---

## ✅ C1 - Unified Card System (COMPLETED & FIXED)

**Status**: ✅ Complete + Architecture Fixed  
**Effort**: 3 hours  
**Completion Date**: 2026-01-17

### Architecture Validation: ✅ PASS

**Checklist:**
- ✅ NO `if (confidence > ...)` in UnifiedCard
- ✅ NO `if (type === 'alert')` in UnifiedCard
- ✅ NO hardcoded text "Indexing", "Paused" in UnifiedCard
- ✅ All styling comes from parent via props
- ✅ UnifiedCard = pure layout component

**Fixed:**
- Removed `getConfidenceStyle()` - parents now pass ready badges
- Removed `STATE_STYLES` logic - parents pass className directly
- Removed `INSIGHT_TONES` - parents pass styled components
- `StatusBadge` and `CardIcon` are now style helpers, not interpreters

### What was done:
1. ✅ Created `UnifiedCard` base component with clear contract
2. ✅ Migrated `AlertRuleCard` to use UnifiedCard
3. ✅ Migrated `WatchlistCard` to use UnifiedCard
4. ✅ Created helper components: `StatusBadge`, `CardIcon`

### Benefits achieved:
- **Visual consistency**: All cards now follow same structure
- **Maintainability**: Single source of truth for card UI
- **Mental model**: Every card answers: What? Status? Actions?
- **Code reduction**: ~40% less code per card component

### Card Structure (Standard):
```
[Icon]  TITLE + Badge
        Subtitle
        
        Primary Insight
        
        Meta info
        
        [Actions]
```

### Remaining migrations (P2):
- TokenCard (in TokensPage)
- ActorCard (in ActorsPage/EntitiesPage)
- SignalCard (in various signal views)

---

## 🟡 P2 - UX Improvements (Non-blockers)

### AlertsPage Enhancements

**Priority**: Medium  
**Effort**: Small (2-3 hours)

#### Features:
1. **Sorting functionality**
   - Sort by `lastTriggeredAt` (most recent first)
   - Sort by `status` (Active → Paused)
   - Default: creation date DESC

2. **"Triggered recently" badge**
   - Show yellow badge for alerts triggered in last 24h
   - Logic: `Date.now() - lastTriggeredAt < 86400000`
   - Badge text: "🔥 Triggered recently"

3. **Implementation notes**:
   ```javascript
   // Add sorting dropdown
   const [sortBy, setSortBy] = useState('createdAt');
   const sortedRules = useMemo(() => {
     const sorted = [...rules];
     if (sortBy === 'triggered') {
       return sorted.sort((a, b) => 
         (b.lastTriggeredAt || 0) - (a.lastTriggeredAt || 0)
       );
     }
     // ... other sorting
   }, [rules, sortBy]);
   ```

---

### Telegram Bot Enhancements

**Priority**: High (but can wait for P3)  
**Effort**: Medium (1 day)

#### Features:
1. **Mute functionality**
   - Inline keyboard button: "🔇 Mute for 24h"
   - Store mute state in `AlertRule.muted_until`
   - Backend: skip dispatching muted alerts

2. **Deep-linking to AlertsPage**
   - Button: "📱 View in App"
   - Link format: `https://app.domain.com/alerts?highlight={ruleId}`
   - Frontend: auto-scroll and highlight on load

3. **Implementation notes**:
   ```javascript
   // Telegram message with inline keyboard
   const keyboard = {
     inline_keyboard: [[
       { text: '🔇 Mute 24h', callback_data: `mute_${ruleId}` },
       { text: '📱 View in App', url: `${APP_URL}/alerts?highlight=${ruleId}` }
     ]]
   };
   ```

---

## 📝 Technical Debt

### Code Quality
- [ ] Add TypeScript types to frontend (currently using PropTypes)
- [ ] Extract alert threshold formatting to utility function
- [ ] Consolidate time formatting functions

### Testing
- [ ] Add unit tests for CreateAlertModal edit mode
- [ ] E2E tests for alert editing flow
- [ ] Telegram webhook integration tests

### Documentation
- [ ] API documentation for alert endpoints
- [ ] Component documentation for CreateAlertModal
- [ ] Deployment guide for production

---

## 🔮 Future Features (P3+)

### Alert Templates
- Pre-configured alert templates for common scenarios
- "Whale activity", "Price pump", "Smart money follow"

### Alert Groups
- Group multiple alerts under a single name
- Batch enable/disable/delete

### Alert History
- Full audit trail of alert edits
- "Revert to previous version" functionality

### Multi-asset Alerts
- Single alert for multiple tokens
- "Alert me when ANY of these tokens..."

### Alert Conditions V2
- Percentage-based thresholds (not just absolute)
- Compound conditions (AND/OR logic)
- Time-of-day filters

---

## ✅ Completed (Reference)

### P0 - Core Alert System
- [x] Create alert rules (POST /api/alerts/rules)
- [x] List user's alerts (GET /api/alerts/rules)
- [x] Delete alerts (DELETE /api/alerts/rules/:id)
- [x] Multi-channel notifications (In-App + Telegram)

### P1 - Alert Management
- [x] Pause/Resume functionality
- [x] Edit alerts (PUT /api/alerts/rules/:id)
- [x] Filter tabs (All/Active/Paused)
- [x] Stats display

### P1.2 - Advanced Alert Conditions
- [x] Threshold input with number formatting
- [x] Direction selector (in/out)
- [x] Time window selector (1h/6h/24h)
- [x] Advanced conditions toggle
- [x] Target context display

### P1.2 - Edit Modal UX (Latest)
- [x] "Save Changes" button text
- [x] "Cannot be changed" badge on target
- [x] "Never triggered" / "Last triggered" display
- [x] Disabled styling for target box

---

**Last Updated**: 2026-01-17  
**Next Review**: P2 planning session
