# A - Alert Intelligence Layer (CORRECT ARCHITECTURE)

**Критическая коррекция**: Начинаем с A0, НЕ с группировки

---

## ПРАВИЛЬНЫЙ ПОРЯДОК (КАНОНИЧЕСКИЙ)

```
raw_signal
   ↓
normalizeEvent(signal)          // A0 ← НАЧАТЬ ЗДЕСЬ
   ↓
dedupEngine.process(event)      // A1
   ↓
severityEngine.score(event)     // A2
   ↓
groupingEngine.assign(event)    // A3
   ↓
alertDispatcher.dispatch(group) // A4
```

---

## A0 - Event Normalization (ОБЯЗАТЕЛЬНЫЙ ПЕРВЫЙ ШАг)

### Problem Statement

**Что не так сейчас:**
- Accumulation имеет свою структуру
- Distribution - другую
- Smart Money - третью
- Large Move - четвертую

**Почему это проблема:**
- Нельзя сравнивать события
- dedupKey будет некорректным
- Группировка невозможна
- Severity не вычислить единообразно

### Goal

"Привести все алерты к единому event-формату"

### Normalized Event Format

```typescript
interface NormalizedAlertEvent {
  // Identity
  eventId: string;
  ruleId: string;
  userId: string;
  
  // What happened
  signalType: string;           // accumulation, distribution, etc
  scope: 'token' | 'wallet' | 'actor' | 'entity';
  targetId: string;
  targetMeta: {
    symbol?: string;
    name?: string;
    chain?: string;
  };
  
  // When
  triggeredAt: Date;
  
  // How much (normalized metrics)
  metrics: {
    value: number;              // actual measured value
    threshold: number;          // rule threshold
    baseline: number;           // baseline for comparison
    deviation: number;          // % deviation from baseline
    direction: 'in' | 'out';    // flow direction
  };
  
  // Quality
  confidence: number;           // 0-1
  
  // Context (for A2 - severity)
  marketContext?: {
    regime: 'trend' | 'range' | 'volatility';
    sentiment: 'bullish' | 'neutral' | 'bearish';
  };
  
  // Raw data (for reference)
  rawSignal: any;
}
```

### Normalization Rules

**Accumulation:**
```typescript
{
  signalType: 'accumulation',
  metrics: {
    value: netInflow,           // 2,500,000 USDT
    threshold: ruleThreshold,   // 1,000,000 USDT
    baseline: avgInflow,        // 1,200,000 USDT
    deviation: +108%,           // (2.5M / 1.2M - 1) * 100
    direction: 'in'
  }
}
```

**Distribution:**
```typescript
{
  signalType: 'distribution',
  metrics: {
    value: netOutflow,          // -1,800,000 USDT
    threshold: ruleThreshold,   // -1,000,000 USDT
    baseline: avgOutflow,       // -800,000 USDT
    deviation: +125%,           // (1.8M / 0.8M - 1) * 100
    direction: 'out'
  }
}
```

**Large Move:**
```typescript
{
  signalType: 'large_move',
  metrics: {
    value: transferAmount,      // 5,000,000 USDT
    threshold: ruleThreshold,   // 3,000,000 USDT
    baseline: avgTransfer,      // 500,000 USDT
    deviation: +900%,           // (5M / 0.5M - 1) * 100
    direction: inferredDirection
  }
}
```

**Smart Money Entry/Exit:**
```typescript
{
  signalType: 'smart_money_entry',
  metrics: {
    value: totalInflow,         // 3,200,000 USDT
    threshold: ruleThreshold,   // 1,000,000 USDT
    baseline: avgSmartFlow,     // 800,000 USDT
    deviation: +300%,
    direction: 'in'
  }
}
```

### Implementation

**File structure:**
```
/app/backend/src/core/alerts/
  normalization/
    event.normalizer.ts       ← Main normalizer
    accumulation.normalizer.ts
    distribution.normalizer.ts
    large_move.normalizer.ts
    smart_money.normalizer.ts
  
  normalized_events.model.ts  ← Store normalized events
  normalized_events.schema.ts
```

**Key principle:**
- Every signal type → same structure
- Comparable metrics
- Ready for dedup/severity/grouping

---

## A1 - Deduplication (AFTER A0)

### Goal

"Это уже было или нет?"

### What we do here:

**NOT:**
- ❌ Groups
- ❌ Lifecycle management
- ❌ Auto-resolve

**YES:**
- ✅ dedupKey = hash(normalized_event)
- ✅ Time window check
- ✅ Mark as: first_seen | repeated | suppressed
- ✅ Store: first occurrence timestamp

### Dedup Logic

```typescript
dedupKey = hash(
  userId +
  signalType +
  targetId +
  Math.floor(triggeredAt / dedupWindow)
)

if (exists(dedupKey)) {
  status = 'repeated'
  suppress = true
} else {
  status = 'first_seen'
  suppress = false
  store(dedupKey, event)
}
```

**Output:**
```typescript
{
  ...normalizedEvent,
  dedupStatus: 'first_seen' | 'repeated' | 'suppressed',
  firstSeenAt: Date,
  occurrenceCount: number
}
```

---

## A2 - Severity & Priority (AFTER A1)

### Goal

"Это важно или нет?"

### Severity Score Formula

```typescript
severityScore = 
  deviationWeight * 0.4 +    // How much > baseline
  confidenceWeight * 0.3 +   // Data quality
  marketWeight * 0.2 +       // Market context
  smartMoneyWeight * 0.1     // Wallet reputation
```

### Priority Buckets

**High (score > 0.7):**
- Large deviation (>50%)
- High confidence (>0.8)
- Smart money involved
- Urgent market regime

**Medium (0.4-0.7):**
- Moderate deviation (20-50%)
- Good confidence (0.6-0.8)
- Notable activity

**Low (<0.4):**
- Small deviation (<20%)
- Lower confidence
- Informational

### Output

```typescript
{
  ...dedupedEvent,
  severity: {
    score: 0.85,
    bucket: 'high',
    reason: 'Large deviation (+108%) with high confidence (0.92)'
  }
}
```

---

## A3 - Grouping (AFTER A2)

### Goal

"Это часть одного процесса?"

### NOW we can do:

- ✅ Groups
- ✅ Lifecycle (active → resolved)
- ✅ Auto-resolve after inactivity
- ✅ "This behavior is ongoing"

### Grouping Logic

```typescript
groupId = hash(
  userId +
  signalType +
  targetId +
  Math.floor(triggeredAt / groupWindow)
)

if (existingGroup && group.isActive) {
  group.addEvent(event)
  group.updateStats()
} else {
  createNewGroup(event)
}
```

---

## A4 - Dispatcher Update (LAST)

### Goal

Update dispatcher to use:
- Normalized events (A0)
- Deduplicated (A1)
- Prioritized (A2)
- Grouped (A3)

### Changes

```typescript
// OLD
dispatcher.dispatch(rawSignal)

// NEW
normalizedEvent = normalizer.normalize(rawSignal)
dedupedEvent = dedupEngine.process(normalizedEvent)
scoredEvent = severityEngine.score(dedupedEvent)
group = groupingEngine.assign(scoredEvent)
dispatcher.dispatch(group)
```

---

## IMPLEMENTATION ORDER (STRICT)

**Week 1: A0 - Event Normalization**
- [ ] Create normalized event schema
- [ ] Implement normalizers for each signal type
- [ ] Store normalized events
- [ ] Test: all signals → same format

**Week 2: A1 - Deduplication**
- [ ] Implement dedupKey generation
- [ ] Time window logic
- [ ] Mark first_seen/repeated
- [ ] Test: suppress duplicates

**Week 3: A2 - Severity**
- [ ] Severity score formula
- [ ] Priority buckets
- [ ] Reason generation
- [ ] Test: correct prioritization

**Week 4: A3 - Grouping**
- [ ] Group lifecycle
- [ ] Auto-resolve logic
- [ ] Group stats
- [ ] Test: groups form correctly

**Week 5: A4 - Integration**
- [ ] Update dispatcher
- [ ] Frontend display
- [ ] Telegram integration
- [ ] E2E testing

---

## CRITICAL RULES

❌ **DON'T:**
- Start with grouping
- Touch dispatcher early
- Do auto-resolve without lifecycle
- Skip normalization

✅ **DO:**
- Start with A0
- Build layer by layer
- Test each layer independently
- Keep layers separated

---

**Status**: 🔵 Ready to start A0 - Event Normalization
**Next**: Create event.normalizer.ts
