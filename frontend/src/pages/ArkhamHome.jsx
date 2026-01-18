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

// Available assets - Only EVM supported
const MARKET_ASSETS = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', supported: true },
  { symbol: 'Arbitrum', address: 'arbitrum', name: 'Arbitrum', supported: false, comingSoon: true },
  { symbol: 'BNB', address: 'bnb', name: 'BNB Chain', supported: false, comingSoon: true },
];

// Asset Selector Component - Only ETH active
function AssetSelector({ assets, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
        data-testid="asset-selector"
      >
        {selected?.symbol || 'Select Asset'}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
            {assets.map((asset) => (
              <Tooltip key={asset.symbol}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (asset.supported) {
                        onSelect(asset);
                        setIsOpen(false);
                      }
                    }}
                    disabled={!asset.supported}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                      asset.supported 
                        ? 'hover:bg-gray-50 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    } ${selected?.symbol === asset.symbol ? 'bg-gray-50 font-medium' : ''}`}
                    data-testid={`asset-option-${asset.symbol.toLowerCase()}`}
                  >
                    <span>{asset.symbol}</span>
                    {asset.comingSoon && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Soon</span>
                    )}
                  </button>
                </TooltipTrigger>
                {asset.comingSoon && (
                  <TooltipContent className="bg-gray-900 text-white">
                    <p className="text-xs">Available after multi-chain expansion</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Market Context Layer - Honest Status
function MarketContextLayer({ marketContext, loading, selectedAsset }) {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading market context...</span>
        </div>
      </div>
    );
  }

  const regime = marketContext?.regime?.current;
  const metrics = marketContext?.metrics;
  const hasData = regime || metrics?.trend || marketContext?.signalReactions?.total24h > 0;

  // Build drivers from actual data
  const buildDrivers = () => {
    const drivers = [];
    
    if (metrics?.trend) {
      drivers.push({
        text: 'Trend',
        value: metrics.trend,
        positive: metrics.trend === 'up' || metrics.trend === 'bullish'
      });
    }
    
    if (metrics?.volatility !== null && metrics?.volatility !== undefined) {
      drivers.push({
        text: 'Volatility',
        value: `${(metrics.volatility * 100).toFixed(1)}%`,
        positive: metrics.volatility < 0.3
      });
    }
    
    if (marketContext?.signalReactions?.total24h > 0) {
      const bullish = marketContext.signalReactions.bullish || 0;
      const total = marketContext.signalReactions.total24h;
      drivers.push({
        text: 'Signals',
        value: `${Math.round(bullish / total * 100)}% bullish`,
        positive: bullish > total / 2
      });
    }

    return drivers;
  };

  const drivers = buildDrivers();
  
  const getRegimeColor = (regimeState) => {
    if (regimeState === 'bullish' || regimeState === 'Risk-On' || regimeState === 'up') return 'text-emerald-600';
    if (regimeState === 'bearish' || regimeState === 'Risk-Off' || regimeState === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  // No data state - Building context
  if (!hasData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Building Market Context
            </h3>
            <p className="text-xs text-amber-700 mb-3">
              We're gathering activity data for {selectedAsset?.symbol || 'ETH'}. 
              Context appears once we detect significant patterns.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/tokens')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-medium transition-colors"
                data-testid="explore-tokens-btn"
              >
                <Search className="w-3.5 h-3.5" />
                Explore tokens
              </button>
              <button
                onClick={() => navigate('/actors')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-medium transition-colors"
                data-testid="view-actors-btn"
              >
                <Users className="w-3.5 h-3.5" />
                View active actors
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has data state
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 font-medium">Market Context</div>
          <div className={`text-base font-bold ${getRegimeColor(regime || metrics?.trend)}`}>
            {regime ? regime.charAt(0).toUpperCase() + regime.slice(1) : (metrics?.trend || 'Neutral')}
          </div>
          {marketContext?.regime?.confidence && (
            <span className="text-xs text-gray-400">
              {Math.round(marketContext.regime.confidence * 100)}% confidence
            </span>
          )}
        </div>
        
        {drivers.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {drivers.map((driver, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={driver.positive ? 'text-emerald-600' : 'text-red-600'}>
                  {driver.positive ? '↑' : '↓'}
                </span>
                <span>{driver.text}</span>
                <span className="font-medium">{driver.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Indexer Status Banner
function IndexerStatusBanner({ status }) {
  if (!status) return null;
  
  const isIdle = status.status === 'idle' || status.status === 'active';
  
  return (
    <div className={`border rounded-xl p-3 mb-4 ${isIdle ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center gap-3">
        {status.status === 'indexing' ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        ) : (
          <Activity className="w-4 h-4 text-gray-500" />
        )}
        <div className="flex-1">
          <div className={`text-sm font-medium ${isIdle ? 'text-gray-700' : 'text-blue-900'}`}>
            {status.status === 'indexing' ? 'Gathering new data' : 'System ready'}
          </div>
          {status.pendingJobs > 0 && (
            <div className="text-xs text-blue-700">
              {status.pendingJobs} items in queue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Market Signal Card - EmptyState only when no data
function MarketSignalEmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4" data-testid="market-signal-empty">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-xl">
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Market Signal</div>
          <div className="text-xs text-gray-500">No market-level signals detected yet</div>
        </div>
      </div>
      <div className="text-xs text-gray-600 space-y-1.5">
        <p className="font-medium text-gray-700">Signals appear when:</p>
        <ul className="list-disc list-inside text-gray-500 space-y-1">
          <li>Smart money clusters align</li>
          <li>Flow anomalies persist over time</li>
          <li>Multiple actors show similar patterns</li>
        </ul>
      </div>
    </div>
  );
}

export default function ArkhamHome() {
  const [selectedAsset, setSelectedAsset] = useState(MARKET_ASSETS[0]);
  const [marketContext, setMarketContext] = useState(null);
  const [indexerStatus, setIndexerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load market context
  const loadMarketContext = useCallback(async () => {
    if (!selectedAsset.supported) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await marketApi.getMarketContext(selectedAsset.address);
      
      if (response?.ok) {
        setMarketContext(response.data);
      } else {
        setError(response?.error || 'Failed to load market context');
      }
    } catch (err) {
      console.error('Failed to load market context:', err);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, [selectedAsset]);

  // Load indexer status
  const loadIndexerStatus = useCallback(async () => {
    try {
      const response = await resolverApi.getIndexerStatus();
      if (response?.ok) {
        setIndexerStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to load indexer status:', err);
    }
  }, []);

  useEffect(() => {
    loadMarketContext();
    loadIndexerStatus();
    
    const interval = setInterval(() => {
      loadMarketContext();
      loadIndexerStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadMarketContext, loadIndexerStatus]);

  const handleRefresh = () => {
    loadMarketContext();
    loadIndexerStatus();
  };

  // Check if we have real signal data
  const hasSignalData = marketContext?.signalReactions?.total24h > 0 || marketContext?.regime?.current;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30" data-testid="market-overview-page">
        <Header />
        
        <PageHeader 
          title="Market Overview"
          description="Real-time on-chain flows, smart money activity, and market trends"
        />
        
        <div className="px-4 mb-8">
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AssetSelector 
                assets={MARKET_ASSETS}
                selected={selectedAsset}
                onSelect={setSelectedAsset}
              />
              <StatusBanner compact className="ml-2" />
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Refresh"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Indexer Status Banner */}
          <IndexerStatusBanner status={indexerStatus} />
          
          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {/* Market Context Layer */}
          <MarketContextLayer 
            marketContext={marketContext}
            loading={loading}
            selectedAsset={selectedAsset}
          />
          
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT COLUMN */}
            <div className="space-y-3">
              {/* Market Signal - Real or EmptyState */}
              {hasSignalData ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4" data-testid="market-signal-real">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Market Signal</div>
                      <div className="text-xs text-gray-500">
                        {marketContext?.signalReactions?.total24h || 0} signals in 24h
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">
                        {marketContext?.signalReactions?.bullish || 0}
                      </div>
                      <div className="text-xs text-gray-500">Bullish</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-600">
                        {marketContext?.signalReactions?.neutral || 0}
                      </div>
                      <div className="text-xs text-gray-500">Neutral</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">
                        {marketContext?.signalReactions?.bearish || 0}
                      </div>
                      <div className="text-xs text-gray-500">Bearish</div>
                    </div>
                  </div>
                </div>
              ) : (
                <MarketSignalEmptyState />
              )}
              
              {/* Flow Anomalies Chart - Connected to real API */}
              <FlowAnomaliesChart asset={selectedAsset.address} />
            </div>
            
            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              {/* Smart Money & Top Narratives */}
              <div className="grid grid-cols-2 gap-3">
                <SmartMoneySnapshot />
                <NarrativesSidebar />
              </div>
              
              {/* Quick Actions */}
              <QuickActions />
            </div>
          </div>
        </div>
        
        <div className="h-8" />
      </div>
    </TooltipProvider>
  );
}
