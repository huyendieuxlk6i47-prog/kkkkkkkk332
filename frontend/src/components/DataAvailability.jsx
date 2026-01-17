/**
 * DataAvailability Component (Phase 16 - Unified Contract)
 * Unified data availability indicator across all pages
 * 
 * CONFIDENCE THRESHOLDS (documented contract):
 * - UI_DISPLAY = 0.4 (show data in UI)
 * - ACTIONS_ENABLED = 0.6 (enable alerts, follow, copy actions)
 */
import { Info, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * Confidence thresholds - documented contract for consistent behavior
 * @constant
 */
export const CONFIDENCE_THRESHOLDS = {
  UI_DISPLAY: 0.4,      // Show data in UI
  ACTIONS_ENABLED: 0.6, // Enable alerts, follow, copy actions
};

/**
 * Standard Data Availability Contract
 * @typedef {Object} DataAvailabilityState
 * @property {boolean} profile - Profile data available
 * @property {boolean} market - Market data available
 * @property {boolean} signals - Signals data available
 * @property {boolean} trust - Trust score available
 * @property {boolean} transfers - Transfer history available
 */

const DATA_KEYS = [
  { key: 'profile', label: 'Profile', description: 'Basic information and metadata' },
  { key: 'market', label: 'Market', description: 'Price, volume, and market metrics' },
  { key: 'signals', label: 'Signals', description: 'Trading signals and alerts' },
  { key: 'trust', label: 'Trust', description: 'Trust and reputation scores' },
  { key: 'transfers', label: 'Transfers', description: 'On-chain transfer history' },
];

/**
 * Determine status based on confidence level
 * @param {number} confidence - Confidence score 0-1
 * @returns {'resolved' | 'indexing' | 'pending' | 'unknown'}
 */
export function getStatusFromConfidence(confidence) {
  if (confidence === null || confidence === undefined) return 'unknown';
  if (confidence >= 0.7) return 'resolved';
  if (confidence >= 0.4) return 'pending';
  return 'indexing'; // < 0.4 = auto-indexing state
}

/**
 * Get status display config
 */
export function getStatusConfig(status, confidence) {
  // Auto-downgrade to indexing if confidence < 0.4
  const effectiveStatus = confidence !== null && confidence < 0.4 ? 'indexing' : status;
  
  const configs = {
    resolved: {
      label: 'Resolved',
      color: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle,
      message: 'Data fully available',
    },
    pending: {
      label: 'Pending',
      color: 'bg-amber-100 text-amber-700',
      icon: AlertCircle,
      message: 'Partial data, more coming soon',
    },
    indexing: {
      label: 'Indexing',
      color: 'bg-blue-100 text-blue-700',
      icon: Loader2,
      animate: true,
      message: 'System is collecting data',
    },
    insufficient_data: {
      label: 'No Data',
      color: 'bg-gray-100 text-gray-500',
      icon: AlertCircle,
      message: 'Insufficient data available',
    },
    unknown: {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-400',
      icon: AlertCircle,
      message: 'Status unknown',
    },
  };

  return configs[effectiveStatus] || configs.unknown;
}

/**
 * Data Availability Grid Component
 */
export default function DataAvailability({ 
  available, 
  confidence,
  className = '',
  compact = false,
  showTitle = true,
}) {
  if (!available) return null;

  // Calculate how much data is available
  const availableCount = DATA_KEYS.filter(({ key }) => available[key]).length;
  const totalCount = DATA_KEYS.length;
  const availabilityPct = Math.round((availableCount / totalCount) * 100);

  // Auto-show indexing message if confidence < 0.4
  const isLowConfidence = confidence !== null && confidence !== undefined && confidence < 0.4;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-500">Data:</span>
        <div className="flex gap-1">
          {DATA_KEYS.map(({ key, label }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    available[key] 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {label.charAt(0)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{label}: {available[key] ? 'Available' : 'Not available'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {isLowConfidence && (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Indexing
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      {showTitle && (
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          Data Availability
          <span className="ml-auto text-xs font-normal text-gray-500">
            {availableCount}/{totalCount} ({availabilityPct}%)
          </span>
        </h3>
      )}
      
      <div className="flex flex-wrap gap-2">
        {DATA_KEYS.map(({ key, label, description }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-help transition-colors ${
                  available[key] 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white max-w-xs">
              <p className="text-xs font-medium mb-1">{label}</p>
              <p className="text-xs text-gray-300">{description}</p>
              <p className="text-xs mt-1">
                Status: {available[key] ? '✓ Available' : '✗ Not available'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Low confidence warning */}
      {isLowConfidence && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-xs text-blue-700">
            Indexing in progress. Data will be available shortly.
          </span>
        </div>
      )}

      {/* All data unavailable message */}
      {availableCount === 0 && !isLowConfidence && (
        <p className="mt-3 text-xs text-gray-500">
          This item is new to our system. Data will be indexed shortly.
        </p>
      )}
    </div>
  );
}

/**
 * Inline status badge with confidence-aware display
 */
export function StatusBadge({ status, confidence, className = '' }) {
  const config = getStatusConfig(status, confidence);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${className}`}>
      <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

/**
 * Resolution Info Panel
 */
export function ResolutionInfo({ 
  type, 
  status, 
  confidence, 
  chain, 
  reason,
  suggestions = [],
  className = '',
}) {
  const config = getStatusConfig(status, confidence);
  const isLowConfidence = confidence !== null && confidence !== undefined && confidence < 0.4;
  const effectiveStatus = isLowConfidence ? 'indexing' : status;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Resolution Details</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Type</span>
          <span className="font-medium text-gray-900 capitalize">{type || 'Unknown'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <StatusBadge status={effectiveStatus} confidence={confidence} />
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Confidence</span>
          <span className={`font-medium ${
            confidence >= 0.7 ? 'text-emerald-600' :
            confidence >= 0.4 ? 'text-amber-600' :
            'text-gray-600'
          }`}>
            {confidence !== null && confidence !== undefined 
              ? `${Math.round(confidence * 100)}%` 
              : '—'}
          </span>
        </div>
        
        {chain && (
          <div className="flex justify-between">
            <span className="text-gray-500">Chain</span>
            <span className="font-medium text-gray-900 capitalize">{chain}</span>
          </div>
        )}
      </div>

      {reason && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Reason</div>
          <div className="text-sm text-gray-700">{reason}</div>
        </div>
      )}

      {/* Low confidence auto-message */}
      {isLowConfidence && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
          <span className="text-xs text-blue-700">
            Low confidence detected. System is actively indexing more data.
          </span>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Suggested Actions</div>
          <div className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700 transition-colors"
              >
                {typeof suggestion === 'string' ? suggestion.replace(/_/g, ' ') : suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
