# C2 - Navigation & Mental Model Implementation Plan

**Status**: 🔵 In Progress  
**Priority**: P1 (Next Step after C1)  
**Goal**: User always knows: Where am I? Why am I here? What's next?

---

## 1️⃣ Breadcrumbs (Contextual, NOT global)

### Philosophy:
- NOT full navigation hierarchy
- ONLY: 1 level back + current context
- Helps answer: "Where am I?"

### Implementation:

**Components needed:**
```javascript
<Breadcrumbs>
  <BreadcrumbItem href="/market">Market</BreadcrumbItem>
  <BreadcrumbItem current>USDT</BreadcrumbItem>
</Breadcrumbs>
```

**Where to add:**
- TokenPage: `Market → USDT`
- TokenPage (alerts view): `Token → USDT → Alerts`
- WalletPage: `Market → 0x123...456`
- WatchlistPage: `Watchlist → Token`

**Rules:**
- Simple text, no icons
- Gray text with purple highlight on hover
- Current item: not clickable, bold

---

## 2️⃣ Empty States = Instructions, NOT "No data"

### Current problems:
- ❌ "No signals detected" - meaningless
- ❌ "No data available" - dead end
- ❌ Generic empty state - user confused

### New approach:
Every EmptyState answers:
1. **Why empty?** - context
2. **What to do next?** - action

### Examples:

**AlertsPage empty:**
```
No market behavior observed yet

Add an alert to monitor accumulation, distribution, 
or large moves on specific tokens or wallets.

[+ Create Alert]
```

**WatchlistPage empty:**
```
Your watchlist is empty

Add tokens or wallets to track their activity 
and set up alerts for important events.

[+ Add Item]
```

**Token alerts empty:**
```
No alerts configured for this token

Create an alert to get notified about 
accumulation, distribution, or smart money activity.

[+ Create Alert for USDT]
```

### Implementation:
Update `/app/frontend/src/components/EmptyState.jsx`

---

## 3️⃣ "Where am I?" Indicator

### For Investigation Views:

Add subtle subtitle to Header:

```javascript
<Header 
  title="USDT"
  subtitle="Token investigation"
/>
```

**Subtitles:**
- MarketPage: "Market overview"
- TokenPage: "Token investigation"
- WalletPage: "Wallet behavior"
- ActorPage: "Actor profile"
- EntityPage: "Entity analysis"

**Styling:**
- Small, gray text under title
- Not prominent, but helpful

---

## Implementation Checklist:

### Phase 1: Breadcrumbs
- [ ] Create `<Breadcrumbs>` component
- [ ] Create `<BreadcrumbItem>` component
- [ ] Add to TokenPage
- [ ] Add to WalletPage
- [ ] Add to WatchlistPage filtered views

### Phase 2: Empty States
- [ ] Update EmptyState component with action prop
- [ ] Rewrite AlertsPage empty state
- [ ] Rewrite WatchlistPage empty state
- [ ] Add context-specific CTAs

### Phase 3: Page Context
- [ ] Add subtitle support to Header component
- [ ] Add subtitles to all investigation pages
- [ ] Test user comprehension

---

## Expected Outcomes:

**Before C2:**
- User confused about location
- Empty states are dead ends
- No clear next steps

**After C2:**
- ✅ Always know current location
- ✅ Empty states guide to action
- ✅ Clear mental model of navigation

---

## Anti-patterns to AVOID:

❌ Full breadcrumb hierarchy (Home > Market > Ethereum > Tokens > USDT)
❌ Redundant navigation (already in sidebar)
❌ Empty states with only "No data"
❌ Over-explaining obvious things

---

## Success Metrics:

- User can answer "Where am I?" in <2 seconds
- Empty states have clear CTAs
- No "lost" feeling when navigating

**Ready to implement C2 Phase 1: Breadcrumbs**
