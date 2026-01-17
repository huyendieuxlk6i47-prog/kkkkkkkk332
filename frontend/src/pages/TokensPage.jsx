/**
 * TokensPage - Investigation View (P0/P1/P2 Complete + Alerts)
 * 
 * Tokens = точка входа для анализа конкретного EVM-токена
 * 
 * 4 уровня данных:
 * - Level 0: Resolution (gate)
 * - Level 1: Token Identity
 * - Level 2: Token Activity (transfers, flows, wallets)
 * - Level 3: Token Signals
 * 
 * Принцип: confidence < 0.4 = IndexingState, не показывать "0" как данные
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, Bell, AlertCircle, ExternalLink, TrendingUp, TrendingDown, 
  Loader2, RefreshCw, Star, Check, Clock, Info,
  ArrowUpRight, ArrowDownRight, Users, Zap, Wallet, ArrowLeftRight
} from 'lucide-react';
import Header from '../components/Header';
import StatusBanner from '../components/StatusBanner';
import DataAvailability, { ResolutionInfo, CONFIDENCE_THRESHOLDS } from '../components/DataAvailability';
import CreateAlertModal from '../components/CreateAlertModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { resolverApi, marketApi } from '../api';

// ============================================================================
// P0: Fixed Token Search - No icon, plain input
// ============================================================================
function TokenSearch({ onResolve, loading, compact = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const searchTokens = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await resolverApi.resolve(q);
      if (response?.ok && response.data) {
        setSuggestions([{
          ...response.data,
          displayName: response.data.label || response.data.symbol || response.data.normalizedId?.slice(0, 10) + '...',
        }]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTokens(value), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onResolve(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSelect = (suggestion) => {
    onResolve(suggestion.normalizedId || suggestion.resolvedAddress);
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <div className={`relative ${compact ? 'w-80' : 'w-full max-w-2xl mx-auto'}`}>
      <form onSubmit={handleSubmit}>
        {/* P0 FIX: Plain input without icon overlay */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search by address, symbol, or ENS..."
          className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm 
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent 
            transition-all placeholder:text-gray-400
            ${compact ? 'py-2 text-xs' : ''}`}
          disabled={loading}
          data-testid="token-search-input"
        />
        {(searching || loading) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSelect(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  suggestion.type === 'token' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Activity className={`w-4 h-4 ${suggestion.type === 'token' ? 'text-purple-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.symbol || suggestion.displayName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {suggestion.normalizedId}
                  </div>
                </div>
                {suggestion.verified && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded flex-shrink-0">
                    Verified
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Entry State - Empty page with search
// ============================================================================
function EntryState({ onResolve, loading }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-6">
        <Activity className="w-8 h-8 text-purple-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Token Analytics</h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        Investigate any EVM token: view on-chain activity, smart money flows, and trading signals
      </p>
      <TokenSearch onResolve={onResolve} loading={loading} />
      
      <div className="mt-6 text-xs text-gray-400 text-center space-y-1">
        <div>Try: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">USDT</span> or <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">0xdac17f958d2ee...</span></div>
      </div>
    </div>
  );
}

// ============================================================================
// P0: Data Availability with Tooltips
// ============================================================================
function DataAvailabilityEnhanced({ available, confidence }) {
  const items = [
    { 
      key: 'profile', 
      label: 'Profile', 
      tooltip: 'Token name, symbol, decimals, and verification status',
      icon: Info
    },
    { 
      key: 'market', 
      label: 'Market', 
      tooltip: 'Price, volume, volatility, and flow metrics',
      icon: TrendingUp
    },
    { 
      key: 'signals', 
      label: 'Signals', 
      tooltip: 'Trading signals from smart money activity',
      icon: Zap
    },
    { 
      key: 'trust', 
      label: 'Trust', 
      tooltip: 'Attribution score and risk assessment',
      icon: Check
    },
    { 
      key: 'transfers', 
      label: 'Transfers', 
      tooltip: 'On-chain transfer history and wallet activity',
      icon: ArrowLeftRight
    },
  ];

  const availableCount = items.filter(item => available?.[item.key]).length;
  const percentage = Math.round((availableCount / items.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Data Availability</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
          percentage >= 40 ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {availableCount}/{items.length} ({percentage}%)
        </span>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {items.map(({ key, label, tooltip, icon: Icon }) => {
          const isAvailable = available?.[key];
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-help transition-colors ${
                  isAvailable ? 'bg-emerald-50' : 'bg-gray-50'
                }`}>
                  <Icon className={`w-4 h-4 ${isAvailable ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${isAvailable ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {isAvailable ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs">
                <p className="text-xs">{tooltip}</p>
                {!isAvailable && (
                  <p className="text-xs text-gray-400 mt-1">
                    Data appears as on-chain history is indexed
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// P1: Token Activity Block
// ============================================================================
function TokenActivityBlock({ resolvedData, marketContext }) {
  // Extract activity metrics from market context
  const transfers24h = marketContext?.activity?.transfers24h;
  const transfers7d = marketContext?.activity?.transfers7d;
  const activeWallets = marketContext?.activity?.activeWallets;
  const netFlow = marketContext?.flows?.netFlow;
  const smartMoneyInvolved = marketContext?.smartMoney?.count > 0;

  const hasActivityData = transfers24h !== undefined || activeWallets !== undefined || netFlow !== undefined;

  // If no data, show indexing state
  if (!hasActivityData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Token Activity</h3>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Indexing
          </span>
        </div>
        <div className="text-center py-6">
          <div className="p-3 bg-gray-100 rounded-xl inline-block mb-3">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Building activity profile</p>
          <p className="text-xs text-gray-500">
            Transfer history and wallet activity will appear once sufficient on-chain data is indexed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Token Activity</h3>
        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Live</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Transfers */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Transfers</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {transfers24h !== undefined ? transfers24h.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-gray-500">24h</div>
          {transfers7d !== undefined && (
            <div className="text-xs text-gray-400 mt-1">
              {transfers7d.toLocaleString()} in 7d
            </div>
          )}
        </div>

        {/* Active Wallets */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Active Wallets</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {activeWallets !== undefined ? activeWallets.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-gray-500">unique addresses</div>
        </div>

        {/* Net Flow */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            {netFlow >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-medium text-gray-600">Net Flow</span>
          </div>
          <div className={`text-xl font-bold ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {netFlow !== undefined ? (
              <>
                {netFlow >= 0 ? '+' : ''}{netFlow.toLocaleString()}
              </>
            ) : '—'}
          </div>
          <div className="text-xs text-gray-500">
            {netFlow >= 0 ? 'Inflow' : 'Outflow'} (24h)
          </div>
        </div>

        {/* Smart Money */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Smart Money</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {smartMoneyInvolved ? (
              <span className="text-purple-600">
                {marketContext?.smartMoney?.count || 0}
              </span>
            ) : '—'}
          </div>
          <div className="text-xs text-gray-500">
            {smartMoneyInvolved ? 'attributed actors' : 'No attributed actors'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// P2: Token Signals Block (improved empty state)
// ============================================================================
function TokenSignalsBlock({ signals, confidence }) {
  const hasSignals = signals && signals.length > 0;
  const actionsEnabled = confidence >= CONFIDENCE_THRESHOLDS.ACTIONS_ENABLED;

  // No signals - explain why
  if (!hasSignals) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Recent Signals</h3>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Zap className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">No signals detected</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {!actionsEnabled ? (
              'Signals will be available once token indexing reaches sufficient confidence'
            ) : (
              'No abnormal trading activity detected. Signals appear when smart money shows significant patterns'
            )}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>Signals track:</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Accumulation</span>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">Distribution</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Large Moves</span>
          </div>
        </div>
      </div>
    );
  }

  // Has signals - show them
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Recent Signals</h3>
        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
          {signals.length} signal{signals.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {signals.slice(0, 5).map((signal, i) => {
          const isBullish = signal.type?.includes('accumulation') || signal.type?.includes('buy');
          const isBearish = signal.type?.includes('distribution') || signal.type?.includes('sell');
          
          return (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                isBullish ? 'bg-emerald-500' : isBearish ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 capitalize truncate">
                  {signal.type || 'Signal'}
                </div>
                {signal.actorAddress && (
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {signal.actorAddress.slice(0, 10)}...
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                {signal.timestamp ? new Date(signal.timestamp).toLocaleDateString() : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// P0: Actions Block - Now WORKING with Alert Modal
// ============================================================================
function TokenActionsBlock({ resolvedData, actionsEnabled, onCreateAlert }) {
  return (
    <div className="flex items-center gap-2">
      {/* Create Alert - NOW WORKING */}
      <button 
        onClick={onCreateAlert}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
        data-testid="create-alert-btn"
      >
        <Bell className="w-4 h-4" />
        Create Alert
      </button>
      
      {/* Add to Watchlist - Coming soon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            disabled
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
          >
            <Star className="w-4 h-4" />
            Watchlist
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white">
          <p className="text-xs">Coming soon — Watchlist integration</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Etherscan - Always enabled */}
      <a 
        href={`https://etherscan.io/address/${resolvedData.normalizedId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Etherscan
      </a>
    </div>
  );
}

// ============================================================================
// Indexing State Component
// ============================================================================
function IndexingState({ resolvedData, onRefresh }) {
  const indexingItems = [
    { key: 'transfers', label: 'Transfers', description: 'On-chain transfer history' },
    { key: 'signals', label: 'Signals', description: 'Smart money activity patterns' },
    { key: 'market', label: 'Market Data', description: 'Price and volume metrics' },
    { key: 'trust', label: 'Trust Score', description: 'Attribution and risk' },
  ];

  return (
    <div className="space-y-4">
      {/* Token Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">
                {resolvedData.symbol || resolvedData.label || 'Unknown Token'}
              </span>
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                INDEXING
              </span>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              {resolvedData.normalizedId}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Chain: {resolvedData.chain || 'ethereum'}
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Indexing Progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <h3 className="font-medium text-blue-900">Indexing in Progress</h3>
            <p className="text-sm text-blue-700">
              Token analytics require indexed on-chain data
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {indexingItems.map(({ key, label, description }) => {
            const available = resolvedData.available?.[key];
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-help ${
                    available ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-500'
                  }`}>
                    {available ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span className="text-sm font-medium">{label}</span>
                    <span className="ml-auto text-xs">
                      {available ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Disabled Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                disabled
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
              >
                <Bell className="w-4 h-4" />
                Create Alert
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white">
              <p className="text-xs">Available after indexing completes</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                disabled
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
              >
                <Star className="w-4 h-4" />
                Watchlist
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white">
              <p className="text-xs">Available after indexing completes</p>
            </TooltipContent>
          </Tooltip>
          
          <a 
            href={`https://etherscan.io/address/${resolvedData.normalizedId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Etherscan
          </a>
        </div>
      </div>

      {/* Data Availability */}
      <DataAvailabilityEnhanced 
        available={resolvedData.available} 
        confidence={resolvedData.confidence}
      />
    </div>
  );
}

// ============================================================================
// Resolved State Component
// ============================================================================
function ResolvedState({ resolvedData, marketContext, onRefresh, onCreateAlert }) {
  const price = marketContext?.price?.current;
  const change24h = marketContext?.price?.change24h;
  const regime = marketContext?.regime?.current;
  const regimeConfidence = marketContext?.regime?.confidence;
  const signals = marketContext?.recentSignals || [];
  
  const actionsEnabled = resolvedData.confidence >= CONFIDENCE_THRESHOLDS.ACTIONS_ENABLED;

  return (
    <div className="space-y-4">
      {/* Token Profile Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-bold">
                {resolvedData.symbol || resolvedData.label || 'Token'}
              </span>
              {resolvedData.verified && (
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED
                </span>
              )}
              {regime && (
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  regime === 'bullish' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : regime === 'bearish'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {regime.toUpperCase()} {regimeConfidence ? `(${Math.round(regimeConfidence * 100)}%)` : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              {price ? (
                <>
                  <span className="text-2xl font-bold text-white">${price.toLocaleString()}</span>
                  {change24h !== null && change24h !== undefined && (
                    <span className={`flex items-center gap-1 ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(change24h).toFixed(2)}% (24h)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">Price data indexing...</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Address</div>
            <div className="text-xs font-mono text-gray-300">
              {resolvedData.normalizedId?.slice(0, 10)}...{resolvedData.normalizedId?.slice(-8)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <TokenActionsBlock 
            resolvedData={resolvedData} 
            actionsEnabled={actionsEnabled}
            onCreateAlert={onCreateAlert}
          />
          <button
            onClick={onRefresh}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Token Activity (P1) */}
          <TokenActivityBlock resolvedData={resolvedData} marketContext={marketContext} />
          
          {/* Token Signals (P2) */}
          <TokenSignalsBlock signals={signals} confidence={resolvedData.confidence} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* Resolution Info */}
          <ResolutionInfo
            type={resolvedData.type}
            status={resolvedData.status}
            confidence={resolvedData.confidence}
            chain={resolvedData.chain}
            reason={resolvedData.reason}
            suggestions={resolvedData.suggestions}
          />
          
          {/* Data Availability with Tooltips */}
          <DataAvailabilityEnhanced 
            available={resolvedData.available} 
            confidence={resolvedData.confidence}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function TokensPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  
  const [resolvedData, setResolvedData] = useState(null);
  const [marketContext, setMarketContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const loadTokenData = useCallback(async (tokenInput) => {
    if (!tokenInput) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const resolveResponse = await resolverApi.resolve(tokenInput);
      
      if (resolveResponse?.ok) {
        setResolvedData(resolveResponse.data);
        
        if (resolveResponse.data.confidence >= CONFIDENCE_THRESHOLDS.UI_DISPLAY) {
          const contextResponse = await marketApi.getMarketContext(
            resolveResponse.data.normalizedId || tokenInput
          );
          
          if (contextResponse?.ok) {
            setMarketContext(contextResponse.data);
          }
        }
      } else {
        setError(resolveResponse?.error || 'Failed to resolve token');
      }
    } catch (err) {
      console.error('Failed to load token data:', err);
      setError('Failed to load token data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      loadTokenData(address);
    }
  }, [address, loadTokenData]);

  const handleResolve = (input) => {
    navigate(`/tokens/${encodeURIComponent(input)}`);
  };

  const handleRefresh = () => {
    if (address) {
      loadTokenData(address);
    }
  };

  const isEntryState = !address && !resolvedData;
  const isIndexingState = resolvedData && resolvedData.confidence < CONFIDENCE_THRESHOLDS.UI_DISPLAY;
  const isResolvedState = resolvedData && resolvedData.confidence >= CONFIDENCE_THRESHOLDS.UI_DISPLAY;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="tokens-page">
        <Header />
        
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <StatusBanner className="mb-4" compact />
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tokens</h1>
              <p className="text-sm text-gray-500">
                Investigate EVM token analytics
              </p>
            </div>
            {!isEntryState && (
              <TokenSearch onResolve={handleResolve} loading={loading} compact />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && !resolvedData && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* States */}
          {isEntryState && !loading && (
            <EntryState onResolve={handleResolve} loading={loading} />
          )}

          {isIndexingState && (
            <IndexingState resolvedData={resolvedData} onRefresh={handleRefresh} />
          )}

          {isResolvedState && (
            <ResolvedState 
              resolvedData={resolvedData} 
              marketContext={marketContext}
              onRefresh={handleRefresh}
              onCreateAlert={() => setShowAlertModal(true)}
            />
          )}
        </div>

        {/* Create Alert Modal */}
        <CreateAlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          tokenAddress={resolvedData?.normalizedId}
          tokenSymbol={resolvedData?.symbol || resolvedData?.label}
          tokenName={resolvedData?.name}
          chain={resolvedData?.metadata?.chain || 'Ethereum'}
          confidence={resolvedData?.confidence}
          onSuccess={() => {
            setShowAlertModal(false);
            // Could show toast notification here
          }}
        />
      </div>
    </TooltipProvider>
  );
}
