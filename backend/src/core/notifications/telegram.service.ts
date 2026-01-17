/**
 * Telegram Notification Service
 * 
 * Handles:
 * - User Telegram connections
 * - Alert notifications via Telegram bot
 * - Message formatting
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// TELEGRAM CONNECTION MODEL
// ============================================================================

export interface ITelegramConnection extends Document {
  _id: Types.ObjectId;
  userId: string;
  chatId: string;
  username?: string;
  firstName?: string;
  isActive: boolean;
  connectedAt: Date;
  lastMessageAt?: Date;
}

const TelegramConnectionSchema = new Schema<ITelegramConnection>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    username: String,
    firstName: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: Date,
  },
  {
    timestamps: true,
    collection: 'telegram_connections',
  }
);

export const TelegramConnectionModel = mongoose.model<ITelegramConnection>(
  'TelegramConnection',
  TelegramConnectionSchema
);

// ============================================================================
// TELEGRAM BOT SERVICE
// ============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

interface TelegramSendResult {
  ok: boolean;
  error?: string;
  messageId?: number;
}

/**
 * Send message via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableNotification?: boolean;
  } = {}
): Promise<TelegramSendResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[Telegram] Bot token not configured');
    return { ok: false, error: 'Bot token not configured' };
  }

  try {
    const url = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_notification: options.disableNotification || false,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      // Update last message timestamp
      await TelegramConnectionModel.updateOne(
        { chatId },
        { lastMessageAt: new Date() }
      ).catch(() => {});
      
      return { ok: true, messageId: data.result?.message_id };
    } else {
      console.error('[Telegram] API error:', data);
      return { ok: false, error: data.description || 'Unknown error' };
    }
  } catch (err) {
    console.error('[Telegram] Send error:', err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Format alert for Telegram
 */
export function formatAlertMessage(alert: {
  title: string;
  message: string;
  scope: string;
  targetId: string;
  signalType: string;
  confidence: number;
  severity: number;
}): string {
  const emoji = getSignalEmoji(alert.signalType);
  const confidencePct = Math.round(alert.confidence * 100);
  
  // Truncate targetId for display
  const targetDisplay = alert.targetId.length > 20 
    ? `${alert.targetId.slice(0, 10)}...${alert.targetId.slice(-6)}`
    : alert.targetId;
  
  return `${emoji} <b>${escapeHtml(alert.title)}</b>

${escapeHtml(alert.message)}

📊 <b>Details:</b>
• Type: ${formatScope(alert.scope)}
• Target: <code>${targetDisplay}</code>
• Confidence: ${confidencePct}%
• Severity: ${alert.severity}/100

<a href="https://blockview.app/${alert.scope}s/${alert.targetId}">View Details →</a>`;
}

/**
 * Format token alert for Telegram
 */
export function formatTokenAlertMessage(alert: {
  tokenSymbol?: string;
  tokenAddress: string;
  signalType: string;
  confidence: number;
  message: string;
}): string {
  const emoji = getTokenSignalEmoji(alert.signalType);
  const confidencePct = Math.round(alert.confidence * 100);
  const symbol = alert.tokenSymbol || 'Unknown';
  
  const addressDisplay = `${alert.tokenAddress.slice(0, 10)}...${alert.tokenAddress.slice(-6)}`;
  
  return `${emoji} <b>Token Alert: ${escapeHtml(symbol)}</b>

${escapeHtml(alert.message)}

📊 <b>Details:</b>
• Signal: ${formatSignalType(alert.signalType)}
• Confidence: ${confidencePct}%
• Address: <code>${addressDisplay}</code>

<a href="https://blockview.app/tokens/${alert.tokenAddress}">View Token →</a>`;
}

/**
 * Send alert notification to user
 */
export async function sendAlertNotification(
  userId: string,
  alert: {
    title: string;
    message: string;
    scope: string;
    targetId: string;
    signalType: string;
    confidence: number;
    severity: number;
  }
): Promise<TelegramSendResult> {
  // Find user's Telegram connection
  const connection = await TelegramConnectionModel.findOne({
    userId,
    isActive: true,
  });

  if (!connection) {
    return { ok: false, error: 'No active Telegram connection' };
  }

  const text = formatAlertMessage(alert);
  return sendTelegramMessage(connection.chatId, text);
}

/**
 * Send token alert notification
 */
export async function sendTokenAlertNotification(
  userId: string,
  alert: {
    tokenSymbol?: string;
    tokenAddress: string;
    signalType: string;
    confidence: number;
    message: string;
  }
): Promise<TelegramSendResult> {
  const connection = await TelegramConnectionModel.findOne({
    userId,
    isActive: true,
  });

  if (!connection) {
    return { ok: false, error: 'No active Telegram connection' };
  }

  const text = formatTokenAlertMessage(alert);
  return sendTelegramMessage(connection.chatId, text);
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Generate connection code for user
 * User sends this code to bot to link account
 */
export function generateConnectionCode(userId: string): string {
  // Simple code: base64 of userId + timestamp
  const payload = `${userId}:${Date.now()}`;
  return Buffer.from(payload).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
}

/**
 * Store pending connection (before user confirms in Telegram)
 */
const pendingConnections = new Map<string, { userId: string; expiresAt: number }>();

export function createPendingConnection(userId: string): string {
  const code = generateConnectionCode(userId);
  pendingConnections.set(code, {
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  return code;
}

export function validatePendingConnection(code: string): string | null {
  const pending = pendingConnections.get(code);
  if (!pending) return null;
  if (Date.now() > pending.expiresAt) {
    pendingConnections.delete(code);
    return null;
  }
  return pending.userId;
}

export function completePendingConnection(code: string): void {
  pendingConnections.delete(code);
}

/**
 * Save Telegram connection
 */
export async function saveTelegramConnection(
  userId: string,
  chatId: string,
  username?: string,
  firstName?: string
): Promise<ITelegramConnection> {
  const connection = await TelegramConnectionModel.findOneAndUpdate(
    { userId },
    {
      chatId,
      username,
      firstName,
      isActive: true,
      connectedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  return connection;
}

/**
 * Get user's Telegram connection
 */
export async function getTelegramConnection(userId: string): Promise<ITelegramConnection | null> {
  return TelegramConnectionModel.findOne({ userId });
}

/**
 * Disconnect Telegram
 */
export async function disconnectTelegram(userId: string): Promise<boolean> {
  const result = await TelegramConnectionModel.updateOne(
    { userId },
    { isActive: false }
  );
  return result.modifiedCount > 0;
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getSignalEmoji(signalType: string): string {
  const emojis: Record<string, string> = {
    'strategy_detected': '🎯',
    'strategy_confirmed': '✅',
    'strategy_shift': '🔄',
    'strategy_phase_change': '📊',
    'strategy_intensity_spike': '📈',
    'strategy_risk_spike': '⚠️',
    'strategy_influence_jump': '🚀',
    'accumulation': '📥',
    'distribution': '📤',
    'large_move': '💰',
    'smart_money_entry': '🐋',
    'smart_money_exit': '🏃',
  };
  return emojis[signalType] || '🔔';
}

function getTokenSignalEmoji(signalType: string): string {
  const emojis: Record<string, string> = {
    'accumulation': '📥',
    'distribution': '📤',
    'large_move': '💰',
    'smart_money_entry': '🐋',
    'smart_money_exit': '🏃',
    'net_flow_spike': '📊',
    'activity_spike': '⚡',
  };
  return emojis[signalType] || '🚨';
}

function formatScope(scope: string): string {
  const names: Record<string, string> = {
    'token': 'Token',
    'actor': 'Actor',
    'entity': 'Entity',
    'strategy': 'Strategy',
  };
  return names[scope] || scope;
}

function formatSignalType(signalType: string): string {
  return signalType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
