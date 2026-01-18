/**
 * Alert Rules MongoDB Model (P0 Architecture)
 * 
 * AlertRule = condition + channel + watchlistItemId
 * 
 * Key principle: AlertRule ALWAYS has watchlistItemId
 * Auto-create WatchlistItem when creating alert
 * 
 * Alert ≠ Watchlist, but Alert ALWAYS linked to Watchlist
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Alert scope types
 */
export type AlertScope = 'strategy' | 'actor' | 'entity' | 'token' | 'wallet';

/**
 * Throttle options
 */
export type ThrottleInterval = '1h' | '6h' | '24h';

/**
 * Trigger types (from strategy signals + token signals)
 */
export type AlertTriggerType =
  // Strategy triggers
  | 'strategy_detected'
  | 'strategy_confirmed'
  | 'strategy_shift'
  | 'strategy_phase_change'
  | 'strategy_intensity_spike'
  | 'strategy_risk_spike'
  | 'strategy_influence_jump'
  // Token triggers (P0)
  | 'accumulation'
  | 'distribution'
  | 'large_move'
  | 'smart_money_entry'
  | 'smart_money_exit'
  | 'net_flow_spike'
  | 'activity_spike';

/**
 * Extended trigger configuration (P0+)
 */
export interface AlertTriggerConfig {
  type: AlertTriggerType;
  threshold?: number;
  direction?: 'in' | 'out';
  window?: '1h' | '6h' | '24h';
}

/**
 * Notification channels
 */
export interface AlertChannels {
  inApp: boolean;
  telegram: boolean;
}

/**
 * Last triggered metadata
 */
export interface LastTriggeredMeta {
  txHash?: string;
  value?: number;
  actorAddress?: string;
  signalId?: string;
}

/**
 * Alert Rule Document Interface
 */
/**
 * Target types for alerts
 */
export type AlertTargetType = 'token' | 'wallet' | 'actor';

/**
 * Feedback status for alert fatigue detection
 */
export interface AlertFeedbackStatus {
  triggersIn24h: number;
  lastFeedbackSentAt?: Date;
  feedbackSent: boolean;
}

export interface IAlertRule extends Document {
  _id: Types.ObjectId;
  
  // User
  userId: string;
  
  // 🔑 REQUIRED: Link to WatchlistItem
  watchlistItemId: Types.ObjectId;
  
  // Target specification (denormalized for queries)
  scope: AlertScope;
  targetType: AlertTargetType;  // 👈 Explicit target type for easier rendering
  targetId: string;  // address or entityId
  
  // Trigger conditions (extended)
  trigger: AlertTriggerConfig;
  triggerTypes: AlertTriggerType[];  // Legacy compatibility
  minSeverity: number;
  minConfidence: number;
  minStability?: number;
  
  // Notification channels
  channels: AlertChannels;
  
  // Throttle to prevent spam
  throttle: ThrottleInterval;
  
  // Status
  status: 'active' | 'paused';
  active: boolean;  // Legacy compatibility
  
  // Last triggered tracking
  lastTriggeredAt?: Date;
  lastTriggeredMeta?: LastTriggeredMeta;
  triggerCount: number;
  
  // Alert Feedback Loop (P3)
  recentTriggerTimestamps: Date[];  // Rolling window of trigger times
  feedbackStatus?: AlertFeedbackStatus;
  
  // Metadata
  name?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Throttle intervals in milliseconds
 */
export const THROTTLE_MS: Record<ThrottleInterval, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

/**
 * Default throttle per trigger type
 */
export const DEFAULT_THROTTLE: Record<string, ThrottleInterval> = {
  'strategy_detected': '24h',
  'strategy_confirmed': '24h',
  'strategy_shift': '6h',
  'strategy_phase_change': '6h',
  'strategy_intensity_spike': '6h',
  'strategy_risk_spike': '6h',
  'strategy_influence_jump': '6h',
  'accumulation': '6h',
  'distribution': '6h',
  'large_move': '1h',
  'smart_money_entry': '6h',
  'smart_money_exit': '6h',
  'net_flow_spike': '6h',
  'activity_spike': '1h',
};

/**
 * Alert Rule Schema
 */
const AlertRuleSchema = new Schema<IAlertRule>(
  {
    // User
    userId: {
      type: String,
      required: true,
      index: true,
    },
    
    // 🔑 REQUIRED: Link to WatchlistItem
    watchlistItemId: {
      type: Schema.Types.ObjectId,
      ref: 'WatchlistItem',
      required: true,
      index: true,
    },
    
    // Target (denormalized for queries and UI rendering)
    scope: {
      type: String,
      enum: ['strategy', 'actor', 'entity', 'token', 'wallet'],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['token', 'wallet', 'actor'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    
    // Extended trigger config
    trigger: {
      type: {
        type: String,
        enum: [
          'strategy_detected', 'strategy_confirmed', 'strategy_shift',
          'strategy_phase_change', 'strategy_intensity_spike',
          'strategy_risk_spike', 'strategy_influence_jump',
          'accumulation', 'distribution', 'large_move',
          'smart_money_entry', 'smart_money_exit',
          'net_flow_spike', 'activity_spike',
        ],
      },
      threshold: Number,
      direction: {
        type: String,
        enum: ['in', 'out'],
      },
      window: {
        type: String,
        enum: ['1h', '6h', '24h'],
      },
    },
    
    // Legacy: trigger types array
    triggerTypes: {
      type: [String],
      enum: [
        'strategy_detected', 'strategy_confirmed', 'strategy_shift',
        'strategy_phase_change', 'strategy_intensity_spike',
        'strategy_risk_spike', 'strategy_influence_jump',
        'accumulation', 'distribution', 'large_move',
        'smart_money_entry', 'smart_money_exit',
        'net_flow_spike', 'activity_spike',
      ],
      default: [],
    },
    
    minSeverity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    minConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.6,
    },
    minStability: {
      type: Number,
      min: 0,
      max: 1,
    },
    
    // Notification channels
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      telegram: {
        type: Boolean,
        default: true,
      },
    },
    
    // Throttle
    throttle: {
      type: String,
      enum: ['1h', '6h', '24h'],
      default: '6h',
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Last triggered
    lastTriggeredAt: Date,
    lastTriggeredMeta: {
      txHash: String,
      value: Number,
      actorAddress: String,
      signalId: String,
    },
    triggerCount: {
      type: Number,
      default: 0,
    },
    
    // Metadata
    name: String,
  },
  {
    timestamps: true,
    collection: 'alert_rules',
  }
);

// Compound indexes
AlertRuleSchema.index({ userId: 1, status: 1 });
AlertRuleSchema.index({ scope: 1, targetId: 1, status: 1 });
AlertRuleSchema.index({ watchlistItemId: 1 });

// Pre-save: sync active with status
AlertRuleSchema.pre('save', function(next) {
  this.active = this.status === 'active';
  next();
});

export const AlertRuleModel = mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);

// ============================================================================
// REPOSITORY FUNCTIONS
// ============================================================================

/**
 * Create alert rule with auto-created WatchlistItem
 */
export async function createAlertRuleWithWatchlist(
  userId: string,
  data: {
    scope: AlertScope;
    targetId: string;
    triggerTypes: AlertTriggerType[];
    trigger?: AlertTriggerConfig;
    channels?: AlertChannels;
    minSeverity?: number;
    minConfidence?: number;
    throttle?: ThrottleInterval;
    name?: string;
    targetMeta?: { symbol?: string; name?: string; chain?: string };
  }
): Promise<IAlertRule> {
  const { findOrCreateWatchlistItem } = await import('../watchlist/watchlist.model.js');
  
  // Map scope to watchlist type / targetType
  const targetType: AlertTargetType = data.scope === 'strategy' ? 'actor' : 
                                       data.scope === 'entity' ? 'actor' :
                                       data.scope as AlertTargetType;
  
  // Auto-create WatchlistItem
  const watchlistItem = await findOrCreateWatchlistItem(
    userId,
    targetType,
    {
      address: data.targetId,
      chain: data.targetMeta?.chain || 'ethereum',
      symbol: data.targetMeta?.symbol,
      name: data.targetMeta?.name,
    }
  );
  
  // Create AlertRule with watchlistItemId and targetType
  const rule = new AlertRuleModel({
    userId,
    watchlistItemId: watchlistItem._id,
    scope: data.scope,
    targetType,  // 👈 Explicit target type
    targetId: data.targetId.toLowerCase(),
    triggerTypes: data.triggerTypes,
    trigger: data.trigger || { type: data.triggerTypes[0] },
    channels: data.channels || { inApp: true, telegram: true },
    minSeverity: data.minSeverity ?? 50,
    minConfidence: data.minConfidence ?? 0.6,
    throttle: data.throttle || '6h',
    name: data.name,
    status: 'active',
    active: true,
    triggerCount: 0,
  });
  
  await rule.save();
  return rule;
}

/**
 * Get user's alert rules with watchlist info
 */
export async function getUserAlertRules(
  userId: string,
  options: { activeOnly?: boolean } = {}
): Promise<IAlertRule[]> {
  const query: any = { userId };
  if (options.activeOnly) {
    query.status = 'active';
  }
  
  return AlertRuleModel.find(query)
    .populate('watchlistItemId')
    .sort({ createdAt: -1 });
}

/**
 * Update alert rule status (pause/resume)
 */
export async function updateAlertRuleStatus(
  userId: string,
  ruleId: string,
  status: 'active' | 'paused'
): Promise<IAlertRule | null> {
  return AlertRuleModel.findOneAndUpdate(
    { _id: ruleId, userId },
    { status, active: status === 'active' },
    { new: true }
  );
}

/**
 * Delete alert rule
 */
export async function deleteAlertRule(
  userId: string,
  ruleId: string
): Promise<boolean> {
  const result = await AlertRuleModel.deleteOne({ _id: ruleId, userId });
  return result.deletedCount > 0;
}

/**
 * Update last triggered info
 */
export async function updateLastTriggered(
  ruleId: string,
  meta?: LastTriggeredMeta
): Promise<void> {
  await AlertRuleModel.updateOne(
    { _id: ruleId },
    {
      lastTriggeredAt: new Date(),
      lastTriggeredMeta: meta,
      $inc: { triggerCount: 1 },
    }
  );
}

/**
 * Get active rules for target
 */
export async function getActiveRulesForTarget(
  scope: AlertScope,
  targetId: string
): Promise<IAlertRule[]> {
  return AlertRuleModel.find({
    scope,
    targetId: targetId.toLowerCase(),
    status: 'active',
  });
}

/**
 * Count alerts for watchlist item
 */
export async function countAlertsForWatchlistItem(
  watchlistItemId: string
): Promise<number> {
  return AlertRuleModel.countDocuments({
    watchlistItemId,
    status: 'active',
  });
}

/**
 * Migration: Add watchlistItemId to existing rules
 */
export async function migrateExistingRules(): Promise<number> {
  const { findOrCreateWatchlistItem } = await import('../watchlist/watchlist.model.js');
  
  // Find rules without watchlistItemId
  const rulesWithoutWatchlist = await AlertRuleModel.find({
    watchlistItemId: { $exists: false },
  });
  
  let migrated = 0;
  
  for (const rule of rulesWithoutWatchlist) {
    try {
      const watchlistType = rule.scope === 'strategy' ? 'actor' : rule.scope;
      
      const watchlistItem = await findOrCreateWatchlistItem(
        rule.userId,
        watchlistType as any,
        {
          address: rule.targetId,
          chain: 'ethereum',
        }
      );
      
      rule.watchlistItemId = watchlistItem._id;
      await rule.save();
      migrated++;
    } catch (err) {
      console.error(`[Migration] Failed to migrate rule ${rule._id}:`, err);
    }
  }
  
  console.log(`[Migration] Migrated ${migrated} alert rules`);
  return migrated;
}
