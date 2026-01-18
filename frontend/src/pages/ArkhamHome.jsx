/**
 * ArkhamHome - Market Overview (P2 Wiring - Connected to Watchlist & Alerts)
 * 
 * CONTRACT:
 * - Market НЕ анализирует сам
 * - Market показывает: Tracked tokens, Tracked wallets, Recent alert groups
 * - Empty CTA: "Track a token or wallet to see market context"
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, RefreshCw, Loader2, AlertCircle,
  Activity, Info, ChevronDown, Search, Users, Bell,
  Wallet, Coins, Star, ExternalLink, Plus, ArrowRight
} from 'lucide-react';
import Header from '../components/Header';
import { PageHeader } from '../components/PageHeader';
import StatusBanner from '../components/StatusBanner';
import { watchlistApi, alertsApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Empty State - if no tracked items */}
            {!loading && !hasAnyTrackedItems && (
              <EmptyMarketState />
            )}
            
            {/* Tracked Tokens */}
            {(loading || trackedTokens.length > 0) && (
              <TrackedItemsCard 
                items={trackedTokens}
                type="token"
                loading={loading}
                onViewAll={() => navigate('/watchlist')}
              />
            )}
            
            {/* Tracked Wallets */}
            {(loading || trackedWallets.length > 0) && (
              <TrackedItemsCard 
                items={trackedWallets}
                type="wallet"
                loading={loading}
                onViewAll={() => navigate('/watchlist')}
              />
            )}
            
            {/* Recent Alerts - full width */}
            <div className="lg:col-span-2">
              <RecentAlertsCard 
                alerts={recentAlerts}
                loading={loading}
                onViewAll={() => navigate('/alerts')}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
