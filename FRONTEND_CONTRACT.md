# FRONTEND CONTRACT

## P0 - Analysis Lifecycle Rules (НИКОГДА НЕ НАРУШАТЬ)

### ❌ ЗАПРЕЩЕНО НАВСЕГДА

```javascript
// ❌ НИКОГДА НЕ ДЕЛАТЬ ЭТО:
if (confidence < 0.4) {
  return <AnalyzingState />; // WRONG!
}

// ❌ НИКОГДА НЕ ДЕЛАТЬ ЭТО:
if (!hasSignals || !hasClusters) {
  return <LoadingSpinner />; // WRONG!
}

// ❌ НИКОГДА НЕ ДЕЛАТЬ ЭТО:
if (available.profile < 5) {
  return <IndexingMessage />; // WRONG!
}
```

### ✅ ЕДИНСТВЕННОЕ ПРАВИЛО

```javascript
// ✅ LIFECYCLE STATUS - ЕДИНСТВЕННЫЙ ИСТОЧНИК ИСТИНЫ:

if (resolution.status === 'analyzing' || resolution.status === 'pending') {
  return <AnalyzingState />; // Показываем прогресс
}

if (resolution.status === 'completed' || resolution.status === 'failed') {
  return <ResultView />; // Показываем результат, ДАЖЕ ЕСЛИ ПУСТОЙ
}
```

## Ключевые принципы

### 1. Analysis Lifecycle ≠ Data Completeness

```
✅ status = 'completed' означает "анализ завершен"
   НЕЗАВИСИМО от результата:
   - нет сигналов → completed + empty state
   - нет кластеров → completed + "No dominant wallets"  
   - низкий confidence → completed + "Limited on-chain data"
   - нет transfers → completed + "No recent activity"

❌ НЕ ПРОВЕРЯЙ confidence, signals, clusters для определения состояния UI
✅ ПРОВЕРЯЙ ТОЛЬКО status
```

### 2. Empty State - это валидный результат

```javascript
// ✅ ПРАВИЛЬНО:
{status === 'completed' && !signals.length && (
  <EmptyState 
    title="No signals detected"
    description="This wallet doesn't have notable behavior patterns yet."
  />
)}

// ❌ НЕПРАВИЛЬНО:
{!signals.length && (
  <LoadingSpinner /> // NO! Может быть просто нет данных
)}
```

### 3. Confidence - это МЕТАДАННЫЕ, не lifecycle

```javascript
// ✅ Confidence используется для:
- Badge/indicator: "High confidence" / "Low confidence"
- Tooltip: "Based on 100 transfers" vs "Based on 3 transfers"
- Warning message: "Limited data available"

// ❌ Confidence НЕ используется для:
- Определения показывать ли UI
- Решения показать loading
- Скрытия блоков/секций
```

## Примеры правильной реализации

### WalletsPage
```javascript
const isActuallyAnalyzing = resolvedData && (
  resolvedData.status === 'analyzing' || 
  resolvedData.status === 'pending'
);

const isAnalysisComplete = resolvedData && (
  resolvedData.status === 'completed' ||
  resolvedData.status === 'failed'
);

return (
  <>
    {isActuallyAnalyzing && <AnalyzingView />}
    {isAnalysisComplete && <ResultView />} {/* Всегда показываем результат */}
  </>
);
```

### TokensPage
```javascript
// ✅ ПРАВИЛЬНО:
{status === 'completed' && (
  <>
    <TokenHeader />
    <ActivitySection data={activity} /> {/* Покажет empty state если нет данных */}
    <DriversSection data={drivers} />   {/* Покажет "No drivers yet" если пусто */}
  </>
)}

// ❌ НЕПРАВИЛЬНО:
{status === 'completed' && confidence > 0.5 && (
  <TokenHeader /> // NO! Даже с низким confidence показываем UI
)}
```

## ResolutionStatus Values

```typescript
type ResolutionStatus = 
  | 'pending'       // Waiting to start analysis
  | 'analyzing'     // Analysis in progress
  | 'completed'     // ✅ TERMINAL - analysis finished
  | 'failed';       // ❌ TERMINAL - analysis failed
```

**ВАЖНО**: 
- `insufficient_data` это OUTCOME (reason), не lifecycle status
- Используй `resolution.reason` и `resolution.available` для data quality
- НЕ создавай собственные pseudo-status на основе confidence/signals

## Проверочный список

Перед коммитом любого UI компонента, убедись:

- [ ] Нет проверок `if (confidence < X)`
- [ ] Нет проверок `if (!signals.length)` для показа loading
- [ ] Все состояния UI определяются ТОЛЬКО через `resolution.status`
- [ ] Empty states показываются при `status === 'completed'` + нет данных
- [ ] Есть graceful degradation для sparse data

## Последствия нарушения

Если нарушить эти правила:
1. Бесконечное "Analyzing" даже когда данных просто нет
2. User думает что "система сломана", хотя она работает корректно
3. Невозможно отличить "анализ идет" от "нет данных"

---

**Этот контракт - архитектурное решение P0, не подлежит изменению без согласования.**

Last Updated: 2025-01-18
