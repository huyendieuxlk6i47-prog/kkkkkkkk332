/**
 * ArkhamHome - Market Overview (P2 Wiring + Discovery)
 * 
 * CONTRACT:
 * - Market показывает: Top Active Tokens, Tracked items, Recent alerts
 * - Discovery: "What's happening right now on-chain"
 * - Watchlist: "What I care about"
 * - Alerts: "What I don't want to miss"
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, RefreshCw, Loader2, AlertCircle,
  Activity, Info, ChevronDown, Search, Users, Bell,
  Wallet, Coins, Star, ExternalLink, Plus, ArrowRight, Flame
} from 'lucide-react';
import Header from '../components/Header';
import { PageHeader } from '../components/PageHeader';
import StatusBanner from '../components/StatusBanner';
import { watchlistApi, alertsApi, marketApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// ============================================================================
// Top Active Tokens Card - Market Discovery
// ============================================================================
function TopActiveTokensCard({ loading, onRefresh }) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  
  useEffect(() => {
    async function loadTopTokens() {
      setLoadingTokens(true);
      try {
        const response = await marketApi.getTopActiveTokens(8, '24h');
        if (response?.ok && response?.data?.tokens) {
          setTokens(response.data.tokens);
        }
      } catch (err) {
        console.error('Failed to load top tokens:', err);
      } finally {
        setLoadingTokens(false);
      }
    }
    loadTopTokens();
  }, []);
  
  if (loadingTokens) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">Top Active Tokens</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Top Active Tokens</h3>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">Indexing in progress...</p>
          <p className="text-xs text-gray-400 mt-1">Data will appear shortly</p>
        </div>
      </div>
    );
  }
  
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">Top Active Tokens</h3>
        </div>
        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-medium">
          Live 24h
        </span>
      </div>
      <div className="space-y-2">
        {tokens.slice(0, 6).map((token, i) => (
          <div 
            key={token.address}
            onClick={() => navigate(`/tokens/${token.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {token.symbol || token.address.slice(0, 8) + '...'}
                </div>
                {token.name && (
                  <div className="text-xs text-gray-500">{token.name}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatNumber(token.transferCount)}
              </div>
              <div className="text-xs text-gray-500">
                {formatNumber(token.activeWallets)} wallets
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/tokens')}
        className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        Explore all tokens →
      </button>
    </div>
  );
}

// ============================================================================
// Emerging Signals Card - Tokens with active signals
// ============================================================================
function EmergingSignalsCard({ loading }) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [interpretation, setInterpretation] = useState(null);
  
  useEffect(() => {
    async function loadSignals() {
      setLoadingSignals(true);
      try {
        const response = await marketApi.getEmergingSignals(6);
        if (response?.ok && response?.data) {
          setTokens(response.data.tokens || []);
          setInterpretation(response.data.interpretation);
        }
      } catch (err) {
        console.error('Failed to load emerging signals:', err);
      } finally {
        setLoadingSignals(false);
      }
    }
    loadSignals();
  }, []);
  
  const getSeverityColor = (severity) => {
    if (severity >= 80) return 'bg-red-100 text-red-700';
    if (severity >= 60) return 'bg-orange-100 text-orange-700';
    return 'bg-yellow-100 text-yellow-700';
  };
  
  if (loadingSignals) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">Emerging Signals</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Emerging Signals</h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Checked</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Activity className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{interpretation?.headline || 'No emerging signals'}</p>
          <p className="text-xs text-gray-500">{interpretation?.description || 'All monitored tokens are within normal activity range.'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">Emerging Signals</h3>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
          {tokens.length} active
        </span>
      </div>
      <div className="space-y-2">
        {tokens.slice(0, 5).map((token, i) => (
          <div 
            key={token.address}
            onClick={() => navigate(`/tokens/${token.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Coins className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                <div className="text-xs text-gray-500">{token.signals.length} signal{token.signals.length > 1 ? 's' : ''}</div>
              </div>
            </div>
            {token.topSignal && (
              <span className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(token.topSignal.severity)}`}>
                {token.topSignal.type.replace('_', ' ')}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/signals')}
        className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        View all signals →
      </button>
    </div>
  );
}

// ============================================================================
// New Actors Card - Recently active wallets
// ============================================================================
function NewActorsCard({ loading }) {
  const navigate = useNavigate();
  const [actors, setActors] = useState([]);
  const [loadingActors, setLoadingActors] = useState(true);
  const [interpretation, setInterpretation] = useState(null);
  
  useEffect(() => {
    async function loadActors() {
      setLoadingActors(true);
      try {
        const response = await marketApi.getNewActors(6);
        if (response?.ok && response?.data) {
          setActors(response.data.actors || []);
          setInterpretation(response.data.interpretation);
        }
      } catch (err) {
        console.error('Failed to load new actors:', err);
      } finally {
        setLoadingActors(false);
      }
    }
    loadActors();
  }, []);
  
  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  if (loadingActors) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-900">New Actors</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!actors || actors.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">New Actors</h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Checked</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Users className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{interpretation?.headline || 'No new actors detected'}</p>
          <p className="text-xs text-gray-500">{interpretation?.description || 'No wallets with significant new activity.'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-900">New Actors</h3>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
          {actors.length} detected
        </span>
      </div>
      <div className="space-y-2">
        {actors.slice(0, 5).map((actor, i) => (
          <div 
            key={actor.address}
            onClick={() => navigate(`/wallets/${actor.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Wallet className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-mono font-medium text-gray-900">{formatAddress(actor.address)}</div>
                <div className="text-xs text-gray-500">{actor.txCount} transfers • {actor.tokenCount} tokens</div>
              </div>
            </div>
            {actor.topToken && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                {actor.topToken}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/wallets')}
        className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        Explore wallets →
      </button>
    </div>
  );
}

// ============================================================================
// Tracked Items Card - Shows tokens or wallets from watchlist
// ============================================================================
function TrackedItemsCard({ items, type, loading, onViewAll }) {
  const navigate = useNavigate();
  const icon = type === 'token' ? Coins : Wallet;
  const Icon = icon;
  const title = type === 'token' ? 'Tracked Tokens' : 'Tracked Wallets';
  const emptyText = type === 'token' ? 'tokens' : 'wallets';
  const viewPath = type === 'token' ? '/tokens' : '/wallets';
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">0</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Icon className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-600 mb-2">No {emptyText} tracked yet</p>
          <p className="text-xs text-gray-500 mb-4">
            Track {emptyText} to see them here and receive alerts
          </p>
          <button
            onClick={() => navigate(viewPath)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {type === 'token' ? 'Token' : 'Wallet'}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, i) => (
          <div 
            key={item._id || i}
            onClick={() => navigate(`${viewPath}/${item.target?.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {item.target?.symbol || item.target?.name || item.target?.address?.slice(0, 10) + '...'}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {item.target?.address?.slice(0, 8)}...{item.target?.address?.slice(-6)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.alertCount > 0 && (
                <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                  <Bell className="w-3 h-3" />
                  {item.alertCount}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
      {items.length > 5 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          View all {items.length} {emptyText} →
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Recent Alert Groups Card
// ============================================================================
function RecentAlertsCard({ alerts, loading, onViewAll }) {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">0</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Bell className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-600 mb-2">No recent alerts</p>
          <p className="text-xs text-gray-500 mb-4">
            Alerts will appear when tracked items show significant activity
          </p>
          <button
            onClick={() => navigate('/alerts')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Manage Alerts
          </button>
        </div>
      </div>
    );
  }
  
  const getSeverityColor = (severity) => {
    if (severity >= 80) return 'bg-red-100 text-red-700 border-red-200';
    if (severity >= 50) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
        </div>
        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">
          {alerts.length} new
        </span>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert, i) => (
          <div 
            key={alert._id || i}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(alert.severity || 50)}`}>
                  {alert.signalType || 'alert'}
                </span>
                <span className="text-xs text-gray-500">
                  {alert.scope || 'token'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString() : '—'}
              </span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">
              {alert.reason?.summary || alert.message || 'Activity detected'}
            </p>
          </div>
        ))}
      </div>
      {alerts.length > 5 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          View all alerts →
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Empty Market State - CTA to track items
// ============================================================================
function EmptyMarketState() {
  const navigate = useNavigate();
  
  return (
    <div className="col-span-full">
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-8 text-center">
        <div className="p-4 bg-white rounded-2xl inline-block mb-4 shadow-sm">
          <Activity className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Market Dashboard</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Track tokens or wallets to see personalized market context and receive alerts 
          when significant activity occurs.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/tokens')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            <Coins className="w-5 h-5" />
            Track Token
          </button>
          <button
            onClick={() => navigate('/wallets')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Wallet className="w-5 h-5" />
            Track Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Quick Stats Summary
// ============================================================================
function QuickStats({ tokenCount, walletCount, alertCount }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Coins className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{tokenCount}</div>
            <div className="text-xs text-gray-500">Tracked Tokens</div>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Wallet className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{walletCount}</div>
            <div className="text-xs text-gray-500">Tracked Wallets</div>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Bell className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{alertCount}</div>
            <div className="text-xs text-gray-500">Active Alerts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArkhamHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trackedTokens, setTrackedTokens] = useState([]);
  const [trackedWallets, setTrackedWallets] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [error, setError] = useState(null);

  // Load watchlist and alerts
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load watchlist items in parallel
      const [tokensRes, walletsRes, alertsRes] = await Promise.all([
        watchlistApi.getWatchlist('token'),
        watchlistApi.getWatchlist('wallet'),
        alertsApi.getAlertsFeed({ limit: 10, unacknowledged: true })
      ]);
      
      if (tokensRes?.ok) {
        setTrackedTokens(tokensRes.data || []);
      }
      
      if (walletsRes?.ok) {
        setTrackedWallets(walletsRes.data || []);
      }
      
      if (alertsRes?.ok) {
        setRecentAlerts(alertsRes.data?.items || alertsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load market data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  const hasAnyTrackedItems = trackedTokens.length > 0 || trackedWallets.length > 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="market-overview-page">
        <Header />
        
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Market</h1>
              <p className="text-sm text-gray-500">
                Your tracked assets and recent activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBanner compact />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
                title="Refresh"
                data-testid="refresh-btn"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Quick Stats - only show if has items */}
          {hasAnyTrackedItems && (
            <QuickStats 
              tokenCount={trackedTokens.length}
              walletCount={trackedWallets.length}
              alertCount={recentAlerts.length}
            />
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* DISCOVERY LAYER */}
            {/* Top Active Tokens - MARKET DISCOVERY (always show) */}
            <TopActiveTokensCard loading={loading} onRefresh={handleRefresh} />
            
            {/* Emerging Signals - NEW */}
            <EmergingSignalsCard loading={loading} />
            
            {/* New Actors - NEW */}
            <NewActorsCard loading={loading} />
            
            {/* Recent Alerts */}
            <RecentAlertsCard 
              alerts={recentAlerts}
              loading={loading}
              onViewAll={() => navigate('/alerts')}
            />
            
            {/* Tracked Tokens - if any */}
            {trackedTokens.length > 0 && (
              <TrackedItemsCard 
                items={trackedTokens}
                type="token"
                loading={loading}
                onViewAll={() => navigate('/watchlist')}
              />
            )}
            
            {/* Tracked Wallets - if any */}
            {trackedWallets.length > 0 && (
              <TrackedItemsCard 
                items={trackedWallets}
                type="wallet"
                loading={loading}
                onViewAll={() => navigate('/watchlist')}
              />
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
