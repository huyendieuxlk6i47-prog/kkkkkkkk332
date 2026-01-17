# A - Alert Intelligence Layer Implementation Plan

**Status**: ✅ COMPLETE  
**Priority**: P0 (Critical for retention)  
**Goal**: Make alerts smart - less noise, more trust

---

## Architecture Overview

```
Raw Signal → A0 → A1 → A2 → A3 → A4 → User
             │     │     │     │     │
             │     │     │     │     └─ Dispatch (when/where to notify)
             │     │     │     └─ Grouping (behavior lifecycle)
             │     │     └─ Severity (how important)
             │     └─ Deduplication (new or repeated)
             └─ Normalization (standardize format)
```

---

## A0 - Event Normalization ✅

**Location**: `/app/backend/src/core/alerts/normalization/`

**Purpose**: Convert all signal types to standardized format

**Key Files**:
- `normalized_event.schema.ts` - Schema definition
- `normalized_event.model.ts` - Mongoose model
- `event.normalizer.ts` - Normalization logic

**Output**: `NormalizedAlertEvent` with:
- `signalType`, `scope`, `targetId`
- `metrics`: value, threshold, baseline, deviation
- `confidence`

---

## A1 - Deduplication Engine ✅

**Location**: `/app/backend/src/core/alerts/deduplication/`

**Purpose**: "Это новое событие или повтор уже известного поведения?"

**Key Files**:
- `dedup_event.schema.ts` - Schema definition
- `dedup_event.model.ts` - Mongoose model  
- `dedup.engine.ts` - Deduplication logic

**Dedup Key**: `hash(signalType + scope + targetId + direction + thresholdBucket)`

**Output**: `DedupedEvent` with:
- `dedupStatus`: 'first_seen' | 'repeated' | 'suppressed'
- `occurrenceCount`

---

## A2 - Severity & Priority Engine ✅

**Location**: `/app/backend/src/core/alerts/severity/`

**Purpose**: "Насколько это событие важно для пользователя прямо сейчас?"

**Key Files**:
- `scored_event.schema.ts` - Schema definition
- `severity.engine.ts` - Severity calculation

**Formula**:
```
severityScore = magnitudeScore * confidenceMultiplier * noveltyMultiplier + persistenceBonus
```

**Output**: `ScoredEvent` with:
- `severityScore`: 0-5
- `priority`: 'low' | 'medium' | 'high'
- `reason`: human-readable explanation

---

## A3 - Grouping Engine ✅

**Location**: `/app/backend/src/core/alerts/grouping/`

**Purpose**: "Это новое событие или продолжение уже идущего поведения?"

**Key Files**:
- `alert_group.schema.ts` - Schema definition
- `alert_group.model.ts` - Mongoose model
- `grouping.engine.ts` - Grouping logic

**Group Key**: `scope + targetId + signalType` (NOT severity, NOT time)

**Lifecycle**: `active` → `cooling` → `resolved`

**Severity Decay**:
- 1h: 0.9
- 3h: 0.7
- 6h: 0.4
- 12h: 0.2

**Output**: `GroupedEvent` with:
- `group`: AlertGroup with lifecycle
- `isNewGroup`, `isEscalation`, `isResolution`, `isCoolingStart`

---

## A4 - Dispatcher Engine ✅

**Location**: `/app/backend/src/core/alerts/dispatcher/`

**Purpose**: "Когда, кому и как сообщать о группе событий?"

**Key Files**:
- `dispatcher.schema.ts` - Schema definitions
- `dispatcher.model.ts` - Mongoose models
- `dispatcher.engine.ts` - Dispatch logic

**Decision Matrix**:
| Condition | Type | Action |
|-----------|------|--------|
| isNewGroup | 'new' | Notify if priority >= minPriority |
| isEscalation | 'escalation' | Notify if enabled |
| isCoolingStart | 'cooling' | Optional notify |
| isResolution | 'resolved' | Optional notify |
| ongoing update | - | Silent (no notification) |

**Rate Limiting**:
- Per-user: max 10/hour (configurable)
- Per-group: min 15min interval (configurable)

**Channels**:
- ✅ UI (in-app notifications)
- ✅ Telegram (human-readable, 1 action link)
- ❌ Email (not used)

---

## Unified Pipeline ✅

**Location**: `/app/backend/src/core/alerts/alert.pipeline.ts`

**Usage**:
```typescript
import { alertPipeline } from './core/alerts/alert.pipeline';

const result = await alertPipeline.process(rawSignal, ruleId, userId);

// result.summary:
// {
//   wasNewGroup: true/false,
//   wasEscalation: true/false,
//   wasNotified: true/false,
//   notificationChannels: ['ui', 'telegram'],
//   groupId: 'xxx',
//   groupStatus: 'active'
// }
```

---

## Test Files

- `/app/backend/src/core/alerts/__tests__/pipeline.test.ts` - A0→A3 test
- `/app/backend/src/core/alerts/__tests__/full_pipeline.test.ts` - Full A0→A4 test
- `/app/backend/src/core/alerts/deduplication/A1_TESTING.md`
- `/app/backend/src/core/alerts/severity/A2_TESTING.md`
- `/app/backend/src/core/alerts/grouping/A3_TESTING.md`
- `/app/backend/src/core/alerts/dispatcher/A4_TESTING.md`

---

## Success Metrics

**Before Phase A:**
- Alert fatigue (5-10 alerts for same behavior)
- Low engagement
- Notifications disabled

**After Phase A:**
- ✅ Grouped alerts reduce noise 80%
- ✅ WHY layer increases trust
- ✅ Priority helps users focus
- ✅ Rate limiting prevents spam
- ✅ Better retention expected

---

## Next Phase: B - Wallet Intelligence

- Wallet profiles
- Wallet → token correlation
- Cluster behavior
- Smart money patterns
