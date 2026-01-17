/**
 * CreateAlertModal - Advanced Token Alert Creation (P1.2)
 * 
 * Features:
 * - Signal type selection with dynamic conditions
 * - Threshold input (≥ X tokens)
 * - Direction selector (in/out)
 * - Time window (1h / 6h / 24h)
 * - Summary preview before submit
 * - Telegram integration
 */
import { useState, useEffect, useMemo } from 'react';
import { X, Bell, Loader2, Check, AlertCircle, ChevronDown, Settings2, Clock } from 'lucide-react';
import { alertsApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Token signal types with insight-first descriptions
const TOKEN_TRIGGERS = [
  { 
    id: 'accumulation', 
    label: 'Consistent Buying', 
    description: 'Large wallets are accumulating this token — often seen before price expansion',
    emoji: '📥',
    hasThreshold: true,
    hasWindow: true,
    defaultDirection: 'in',
  },
  { 
    id: 'distribution', 
    label: 'Increasing Selling', 
    description: 'Holders are distributing to the market — can indicate profit-taking or risk reduction',
    emoji: '📤',
    hasThreshold: true,
    hasWindow: true,
    defaultDirection: 'out',
  },
  { 
    id: 'large_move', 
    label: 'Large Movement', 
    description: 'Significant token movement detected — may signal whale activity or exchange flows',
    emoji: '💰',
    hasThreshold: true,
    hasWindow: false,
    showDirection: true,
  },
  { 
    id: 'smart_money_entry', 
    label: 'Smart Money Entry', 
    description: 'Historically profitable wallets are entering — early positioning signal',
    emoji: '🐋',
    hasThreshold: true,
    hasWindow: true,
    defaultDirection: 'in',
  },
  { 
    id: 'smart_money_exit', 
    label: 'Smart Money Exit', 
    description: 'Historically profitable wallets are exiting — potential profit-taking or risk reduction',
    emoji: '🏃',
    hasThreshold: true,
    hasWindow: true,
    defaultDirection: 'out',
  },
];

// Time window options
const WINDOW_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
];

// Format number with commas
function formatNumber(num) {
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Parse formatted number
function parseFormattedNumber(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

export default function CreateAlertModal({ 
  isOpen, 
  onClose, 
  tokenAddress, 
  tokenSymbol,
  tokenName,
  chain = 'Ethereum',
  confidence,
  onSuccess,
  // Edit mode props
  editMode = false,
  existingRule = null,
}) {
  // Selected trigger type (single selection for advanced conditions)
  const [selectedTrigger, setSelectedTrigger] = useState(
    editMode && existingRule?.triggerTypes?.[0] 
      ? existingRule.triggerTypes[0] 
      : 'accumulation'
  );
  
  // Advanced conditions
  const [threshold, setThreshold] = useState(
    editMode && existingRule?.trigger?.threshold 
      ? formatNumber(existingRule.trigger.threshold) 
      : ''
  );
  const [direction, setDirection] = useState(
    editMode && existingRule?.trigger?.direction
      ? existingRule.trigger.direction
      : 'in'
  );
  const [window, setWindow] = useState(
    editMode && existingRule?.trigger?.window
      ? existingRule.trigger.window
      : '6h'
  );
  
  // Show advanced options
  const [showAdvanced, setShowAdvanced] = useState(editMode || false);
  
  // Notification channels
  const [telegramEnabled, setTelegramEnabled] = useState(
    editMode ? existingRule?.channels?.telegram ?? true : true
  );
  const [uiEnabled, setUiEnabled] = useState(
    editMode ? existingRule?.channels?.inApp ?? true : true
  );
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLink, setTelegramLink] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingTelegram, setCheckingTelegram] = useState(true);

  // Get current trigger config
  const currentTrigger = useMemo(() => 
    TOKEN_TRIGGERS.find(t => t.id === selectedTrigger) || TOKEN_TRIGGERS[0],
    [selectedTrigger]
  );

  // Update direction when trigger changes
  useEffect(() => {
    if (currentTrigger.defaultDirection) {
      setDirection(currentTrigger.defaultDirection);
    }
  }, [currentTrigger]);

  // Check Telegram connection on mount
  useEffect(() => {
    if (isOpen) {
      checkTelegramStatus();
      // Reset state when opening (unless edit mode)
      if (!editMode) {
        setSuccess(false);
        setError(null);
      }
    }
  }, [isOpen, editMode]);

  const checkTelegramStatus = async () => {
    setCheckingTelegram(true);
    try {
      const response = await alertsApi.getTelegramConnection();
      setTelegramConnected(response?.connected || false);
    } catch (err) {
      console.error('Failed to check Telegram status:', err);
    } finally {
      setCheckingTelegram(false);
    }
  };

  const generateTelegramLink = async () => {
    try {
      const response = await alertsApi.connectTelegram();
      if (response?.ok && response?.link) {
        setTelegramLink(response.link);
      }
    } catch (err) {
      console.error('Failed to generate Telegram link:', err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build trigger config
      const triggerConfig = {
        type: selectedTrigger,
      };
      
      // Add threshold if provided
      const thresholdValue = parseFormattedNumber(threshold);
      if (thresholdValue && currentTrigger.hasThreshold) {
        triggerConfig.threshold = thresholdValue;
      }
      
      // Add direction
      if (currentTrigger.showDirection || currentTrigger.defaultDirection) {
        triggerConfig.direction = direction;
      }
      
      // Add window
      if (currentTrigger.hasWindow) {
        triggerConfig.window = window;
      }

      const payload = {
        scope: 'token',
        targetId: tokenAddress,
        triggerTypes: [selectedTrigger],
        trigger: triggerConfig,
        channels: {
          inApp: uiEnabled,
          telegram: telegramEnabled && telegramConnected,
        },
        minSeverity: 50,
        minConfidence: 0.6,
        throttle: window || '6h',
        name: `${tokenSymbol || tokenName || 'Token'} ${currentTrigger.label} Alert`,
        targetMeta: {
          symbol: tokenSymbol,
          name: tokenName,
          chain: chain,
        },
      };

      let response;
      if (editMode && existingRule?._id) {
        response = await alertsApi.updateAlertRule(existingRule._id, payload);
      } else {
        response = await alertsApi.createAlertRule(payload);
      }

      if (response?.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(response?.error || `Failed to ${editMode ? 'update' : 'create'} alert`);
      }
    } catch (err) {
      console.error(`Failed to ${editMode ? 'update' : 'create'} alert:`, err);
      setError(`Failed to ${editMode ? 'update' : 'create'} alert`);
    } finally {
      setLoading(false);
    }
  };

  // Build summary text
  const summaryText = useMemo(() => {
    const parts = [];
    parts.push(`${currentTrigger.emoji} ${currentTrigger.label}`);
    
    const thresholdValue = parseFormattedNumber(threshold);
    if (thresholdValue && currentTrigger.hasThreshold) {
      parts.push(`≥ ${formatNumber(thresholdValue)} ${tokenSymbol || 'tokens'}`);
    }
    
    if (currentTrigger.hasWindow) {
      const windowLabel = WINDOW_OPTIONS.find(w => w.value === window)?.label || window;
      parts.push(`in ${windowLabel}`);
    }
    
    return parts.join(' • ');
  }, [selectedTrigger, threshold, window, tokenSymbol, currentTrigger]);

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header with Target Context */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editMode ? 'Edit Alert' : 'Create Alert'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                data-testid="close-modal-btn"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Target Context Box */}
            <div className={`bg-white border rounded-xl p-3 ${editMode ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target</span>
                {editMode && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                    Cannot be changed
                  </span>
                )}
                {confidence && !editMode && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    confidence >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
                    confidence >= 0.6 ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {Math.round(confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold ${editMode ? 'text-gray-600' : 'text-gray-900'}`}>
                  {tokenSymbol || tokenName || 'Token'}
                </span>
                <span className={`text-sm ${editMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {chain}
                </span>
              </div>
              <div className={`text-xs font-mono mt-1 ${editMode ? 'text-gray-400' : 'text-gray-400'}`}>
                {tokenAddress}
              </div>
              {editMode && existingRule?.lastTriggeredAt && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Last observed: {new Date(existingRule.lastTriggeredAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
              {editMode && !existingRule?.lastTriggeredAt && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>No activity yet</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Success State */}
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {editMode ? 'Monitoring Updated' : 'Monitoring Active'}
                </h3>
                <p className="text-sm text-gray-500">
                  You'll be notified when this behavior is observed on-chain
                </p>
              </div>
            ) : (
              <>
                {/* Signal Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {TOKEN_TRIGGERS.map((trigger) => (
                      <button
                        key={trigger.id}
                        onClick={() => setSelectedTrigger(trigger.id)}
                        data-testid={`trigger-${trigger.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selectedTrigger === trigger.id
                            ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{trigger.emoji}</span>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900">{trigger.label}</div>
                          <div className="text-xs text-gray-500">{trigger.description}</div>
                        </div>
                        {selectedTrigger === trigger.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Conditions Toggle */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  data-testid="toggle-advanced-btn"
                >
                  <Settings2 className="w-4 h-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Conditions
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {/* Advanced Conditions Panel */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    {/* Threshold */}
                    {currentTrigger.hasThreshold && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
                          Minimum Amount
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">≥</span>
                          <input
                            type="text"
                            value={threshold}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9,]/g, '');
                              const num = parseFormattedNumber(val);
                              setThreshold(num ? formatNumber(num) : val);
                            }}
                            placeholder="1,000,000"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            data-testid="threshold-input"
                          />
                          <span className="text-sm text-gray-500 font-medium">
                            {tokenSymbol || 'tokens'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Leave empty for any amount
                        </p>
                      </div>
                    )}

                    {/* Direction (only for large_move) */}
                    {currentTrigger.showDirection && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
                          Direction
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDirection('in')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              direction === 'in'
                                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
                            }`}
                            data-testid="direction-in-btn"
                          >
                            📥 Inflow
                          </button>
                          <button
                            onClick={() => setDirection('out')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              direction === 'out'
                                ? 'bg-red-100 text-red-700 border-2 border-red-500'
                                : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
                            }`}
                            data-testid="direction-out-btn"
                          >
                            📤 Outflow
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Time Window */}
                    {currentTrigger.hasWindow && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
                          Time Window
                        </label>
                        <div className="flex gap-2">
                          {WINDOW_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setWindow(opt.value)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                window === opt.value
                                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                                  : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
                              }`}
                              data-testid={`window-${opt.value}-btn`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Alert once per window when condition is met
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notification Channels */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Notification Channels
                  </label>
                  <div className="space-y-2">
                    {/* UI Notifications */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">In-App</span>
                      </div>
                      <button
                        onClick={() => setUiEnabled(!uiEnabled)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          uiEnabled ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                        data-testid="toggle-inapp-btn"
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          uiEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Telegram */}
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Telegram</span>
                          {checkingTelegram ? (
                            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                          ) : telegramConnected ? (
                            <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                              Connected
                            </span>
                          ) : null}
                        </div>
                        {telegramConnected && (
                          <button
                            onClick={() => setTelegramEnabled(!telegramEnabled)}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              telegramEnabled ? 'bg-[#0088cc]' : 'bg-gray-300'
                            }`}
                            data-testid="toggle-telegram-btn"
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              telegramEnabled ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                        )}
                      </div>
                      
                      {/* Connect Telegram CTA */}
                      {!checkingTelegram && !telegramConnected && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          {telegramLink ? (
                            <div className="text-xs">
                              <p className="text-gray-500 mb-1">Click to connect:</p>
                              <a
                                href={telegramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0088cc] hover:underline break-all"
                              >
                                {telegramLink}
                              </a>
                            </div>
                          ) : (
                            <button
                              onClick={generateTelegramLink}
                              className="text-xs text-[#0088cc] hover:underline"
                              data-testid="connect-telegram-btn"
                            >
                              Connect Telegram to receive alerts →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Summary
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{summaryText}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>Target: {tokenSymbol || tokenName || 'Token'} ({chain})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>Notifications: {[
                        uiEnabled && 'In-App',
                        telegramEnabled && telegramConnected && 'Telegram'
                      ].filter(Boolean).join(', ') || 'None'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleSubmit}
                disabled={loading || (!uiEnabled && !(telegramEnabled && telegramConnected))}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                data-testid="submit-alert-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    {editMode ? 'Save Changes' : 'Create Alert'}
                  </>
                )}
              </button>
              
              {!uiEnabled && !(telegramEnabled && telegramConnected) && (
                <p className="text-xs text-center text-red-500 mt-2">
                  Enable at least one notification channel
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
