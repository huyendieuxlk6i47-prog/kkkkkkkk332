# Product Copy Map - Language Unification

**Philosophy**: Backend термины НИКОГДА не показываются напрямую пользователю.

---

## Signal Types

| Backend Term | UI Text | Explanation (tooltip) |
|--------------|---------|----------------------|
| accumulation | Consistent buying activity | Large wallets are accumulating this token |
| distribution | Increasing selling pressure | Holders are distributing to the market |
| large_transfer | Unusual large movement | Significant token movement detected |
| smart_money_entry | Notable wallet activity | Historically profitable wallets entering |
| smart_money_exit | Notable wallet activity | Historically profitable wallets exiting |

---

## Status & States

| Backend Term | UI Text | Context |
|--------------|---------|---------|
| No signals detected | No significant on-chain activity yet | Use in empty states |
| Indexing in progress | Data is being prepared | Use for loading states |
| Pending | Analysis starting | Use for new items |
| Active | Monitoring | For alerts |
| Paused | Not monitoring | For paused alerts |

---

## Confidence Levels

| Backend Value | UI Text | Color |
|---------------|---------|-------|
| >= 0.8 | High confidence | Green |
| 0.6 - 0.79 | Moderate confidence | Amber |
| < 0.6 | Gathering data | Gray |

**Copy guideline**: Never show raw percentage unless user explicitly asks for details.

---

## Action Labels

| Generic Button | Product-focused Text | Context |
|----------------|---------------------|---------|
| Create Alert | Monitor this behavior | Alert creation |
| Add to Watchlist | Track future activity | Watchlist add |
| View Details | Investigate on-chain | Deep dive |
| Edit Alert | Adjust monitoring | Alert edit |
| Delete | Stop monitoring | Alert delete |

---

## Empty State Messages

| Screen | Title | Description |
|--------|-------|-------------|
| AlertsPage | No market behavior observed yet | Add an alert to monitor accumulation, distribution, or large moves on specific tokens or wallets |
| WatchlistPage | Your watchlist is empty | Add tokens or wallets to track their activity and set up alerts for important events |
| TokenPage (no signals) | No significant on-chain activity yet | This token hasn't shown notable patterns in recent on-chain data |
| WalletPage (no data) | Not enough activity yet | This address needs more on-chain transactions to generate meaningful insights |

---

## Page Context Subtitles

| Page | Subtitle | Purpose |
|------|----------|---------|
| Market | Market overview | Sets investigation tone |
| Tokens | Token investigation | Investigation view |
| Wallets | Wallet behavior | Behavior analysis |
| Alerts | Market behavior monitoring | Clear purpose |
| Watchlist | Monitoring overview | Active tracking |

---

## C3.B - Insight-first Patterns (WHY before WHAT)

### Rule: Every block must contain:
1. **Insight sentence** (1-2 lines, human explanation)
2. **Evidence** (data, secondary)
3. **Implication** (what it means)
4. **Next action** (what to do)

### Signal Cards

**Accumulation:**
- **Insight**: "Large wallets are consistently buying this token"
- **Evidence**: Net inflow metrics, wallet count
- **Implication**: "This behavior often indicates long-term positioning and can precede price expansion"
- **Action**: "Monitor this behavior" / "Get notified if it continues"

**Distribution:**
- **Insight**: "Holders are distributing to the market"
- **Evidence**: Net outflow metrics, selling pressure
- **Implication**: "Sustained selling can indicate profit-taking or reduced confidence"
- **Action**: "Track selling pressure" / "Alert on threshold"

**Large Movement:**
- **Insight**: "Significant token movement detected"
- **Evidence**: Transfer size, wallet addresses
- **Implication**: "Large movements often signal institutional activity or major holder decisions"
- **Action**: "Investigate wallets" / "Monitor similar moves"

**Smart Money Entry:**
- **Insight**: "Historically profitable wallets are entering"
- **Evidence**: Wallet track records, entry timing
- **Implication**: "Wallets with strong track records entering can be an early positioning signal"
- **Action**: "Follow these wallets" / "Track associated tokens"

**Smart Money Exit:**
- **Insight**: "Historically profitable wallets are exiting"
- **Evidence**: Exit patterns, profit realization
- **Implication**: "Profitable wallets exiting may indicate local tops or risk management"
- **Action**: "Review position" / "Monitor for re-entry"

### Flow Anomalies

**Pattern:**
- **Insight**: "Capital is moving unusually fast between major wallets"
- **Evidence**: Flow velocity, wallet network
- **Implication**: "Such movements frequently appear before sharp price reactions"
- **Action**: "Create alert for similar movements" / "Explore involved wallets"

### Market Context

**Increased Activity:**
- **Insight**: "The market is showing elevated on-chain activity"
- **Evidence**: Transaction volume, active addresses
- **Implication**: "Increased activity often precedes volatility"
- **Action**: "Review active tokens" / "Adjust monitoring"

**Distribution Pressure:**
- **Insight**: "The market is showing signs of distribution pressure"
- **Evidence**: Net flows, smart money behavior
- **Implication**: "This often precedes short-term volatility or local tops"
- **Action**: "Track smart money" / "Monitor key levels"

---

## Insight-first Patterns (WHY before WHAT)

### Signal Cards
❌ **Before**: "Accumulation detected"  
✅ **After**: "Consistent buying activity — large wallets are accumulating this token"

### Flow Anomalies
❌ **Before**: "Flow anomaly detected"  
✅ **After**: "Capital is moving unusually fast between major wallets — this often precedes volatility"

### Smart Money
❌ **Before**: "Smart Money activity"  
✅ **After**: "Historically profitable wallets are becoming more active in this market"

---

## Tone Guidelines

**Спокойный**: Never hype, never panic  
**Исследовательский**: "Here's what we're observing..."  
**Честный**: "Not enough data yet" vs "No data"

**Avoid**:
- "Detected" (too robotic)
- "No data" (too negative)
- Technical jargon without context
- Alarm words without explanation

**Use**:
- "Observed"
- "Not enough activity yet"
- Plain explanations
- Context before conclusion

---

## Implementation Priority

**P0** (Must do):
- Alert type labels
- Empty state messages
- Action button texts

**P1** (Should do):
- Signal card descriptions
- Tooltip explanations
- Page subtitles

**P2** (Nice to have):
- In-depth tooltips
- Help text
- Onboarding messages
