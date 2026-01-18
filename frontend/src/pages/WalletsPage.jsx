/**
 * WalletsPage - REAL MODE (Phase 16 + P2.3 WebSocket Live Updates)
 * 
 * ARCHITECTURE:
 * - Input address → resolver → real data OR indexing state
 * - NO mock metrics when indexing
 * - Reference wallets as suggestions only (no fake data)
 * - Live progress updates via WebSocket (P2.3) with polling fallback
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, Search, ArrowUpRight, Star, Bell, Activity, Shield,
  Info, X, ChevronUp, ChevronDown, Check, AlertTriangle, Zap,
  TrendingUp, TrendingDown, Loader2, RefreshCw, Copy, Wifi, WifiOff
} from 'lucide-react';
import Header from '../components/Header';
import SearchInput from '../components/shared/SearchInput';
import StatusBanner from '../components/StatusBanner';
import EmptyState from '../components/EmptyState';
import DataAvailability, { ResolutionInfo, StatusBadge } from '../components/DataAvailability';
import BehaviorFingerprint from '../components/BehaviorFingerprint';
import ReputationCard from '../components/ReputationCard';
import WalletProfileCard from '../components/WalletProfileCard';
import WalletActivitySnapshot from '../components/WalletActivitySnapshot';
import { IndexingState } from '../components/IndexingState';
import { useBootstrapProgress, formatStepName } from '../hooks/useBootstrapProgress';
import { useWebSocket } from '../hooks/useWebSocket';

// B2-B4 Components
import RelatedAddresses from '../components/RelatedAddresses';
import SmartMoneyProfile from '../components/SmartMoneyProfile';

// Wallet Tracking & Alerts
import TrackWalletButton from '../components/TrackWalletButton';
import CreateWalletAlertModal from '../components/CreateWalletAlertModal';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { resolverApi, walletsApi } from '../api';

// Reference wallets for quick selection (labels only, no fake metrics)
const REFERENCE_WALLETS = [
  { label: 'Vitalik.eth', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', type: 'Smart Money' },
  { label: 'Justin Sun', address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296', type: 'Whale' },
  { label: 'Wintermute', address: '0x4f3a120E72C76c22ae802D129F599BFDbc31cb81', type: 'Market Maker' },
  { label: 'Jump Trading', address: '0x9Bf4001d307dFd62B26A2F1307ee0C0307632d59', type: 'Market Maker' },
  { label: 'Three Arrows Capital', address: '0x716034C25D9Fb4b38c837aFe417B7a2e4d69Bbe6', type: 'Fund' },
];

// Wallet Quick Select Button
function WalletQuickSelect({ wallet, onSelect }) {
  return (
    <button
      onClick={() => onSelect(wallet.address)}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-left"
    >
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
        <Wallet className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{wallet.label}</div>
        <div className="text-xs text-gray-500">{wallet.type}</div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

// Indexing State for Wallet (P2.3 - WebSocket Live Updates with polling fallback)
function WalletIndexingState({ resolvedData, onSetAlert, onIndexingComplete }) {
  const dedupKey = resolvedData?.bootstrap?.dedupKey;
  
  // Local state for WebSocket updates
  const [wsProgress, setWsProgress] = useState(null);
  const [wsStep, setWsStep] = useState(null);
  const [wsEta, setWsEta] = useState(null);
  const [wsStatus, setWsStatus] = useState(null);
  
  // WebSocket connection (P2.3)
  const { isConnected } = useWebSocket({
    subscriptions: ['bootstrap'],
    enabled: !!dedupKey,
    onEvent: (event) => {
      // Filter by dedupKey
      if (event.dedupKey !== dedupKey) return;
      
      switch (event.type) {
        case 'bootstrap.progress':
          setWsProgress(event.progress);
          setWsStep(event.step);
          setWsEta(event.eta);
          setWsStatus('running');
          break;
        case 'bootstrap.done':
          setWsProgress(100);
          setWsStatus('done');
          if (onIndexingComplete) {
            onIndexingComplete();
          }
          break;
        case 'bootstrap.failed':
          setWsStatus('failed');
          break;
      }
    },
  });
  
  // Polling fallback (only when WS not connected)
  const pollingEnabled = !!dedupKey && !isConnected;
  const bootstrapProgress = useBootstrapProgress(
    dedupKey,
    pollingEnabled,
    (status) => {
      if (status === 'done' && onIndexingComplete) {
        onIndexingComplete();
      }
    }
  );

  // Use WebSocket data if connected, otherwise fallback to polling or resolver data
  const progress = wsProgress ?? (isConnected ? 0 : (bootstrapProgress.progress || resolvedData?.bootstrap?.progress || 0));
  const step = wsStep ?? (isConnected ? null : (bootstrapProgress.step || resolvedData?.bootstrap?.step));
  const etaSeconds = wsEta ?? (isConnected ? null : (bootstrapProgress.etaSeconds || resolvedData?.bootstrap?.etaSeconds));
  const status = wsStatus ?? (isConnected ? 'queued' : (bootstrapProgress.status || 'running'));

  return (
    <div className="space-y-6">
      {/* Live Indexing Progress */}
      <IndexingState
        progress={progress}
        step={step}
        etaSeconds={etaSeconds}
        status={status}
        attempts={bootstrapProgress.attempts}
        showHint={true}
      />
      
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span>Live updates</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-gray-400" />
            <span>Polling updates</span>
          </>
        )}
      </div>

      {/* Notify Button */}
      <div className="flex justify-center">
        <button
          onClick={onSetAlert}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Notify when ready
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Availability */}
        {resolvedData?.available && (
          <DataAvailability 
            available={resolvedData.available}
            confidence={resolvedData.confidence}
          />
        )}

        {/* Resolution Info */}
        {resolvedData && (
          <ResolutionInfo
            type={resolvedData.type}
            status={resolvedData.status}
            confidence={resolvedData.confidence}
            chain={resolvedData.chain}
            reason={resolvedData.reason}
            suggestions={resolvedData.suggestions}
          />
        )}
      </div>
    </div>
  );
}

// Resolved Wallet View - Real Data Only (with B1-B4 components)
function WalletResolvedView({ resolvedData, walletData, walletProfile, onCreateAlert }) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedData.normalizedId);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleWalletClick = (walletAddress) => {
    navigate(`/wallets/${walletAddress}`);
  };

  const handleReviewCluster = (clusterId) => {
    setSelectedClusterId(clusterId);
    setShowClusterModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {walletProfile?.summary?.headline || resolvedData.label || 'Wallet'}
                </h1>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 capitalize">
                  {resolvedData.type || 'Address'}
                </span>
                <StatusBadge 
                  status={resolvedData.status} 
                  confidence={resolvedData.confidence} 
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs font-mono text-gray-500">
                  {resolvedData.normalizedId?.slice(0, 10)}...{resolvedData.normalizedId?.slice(-8)}
                </code>
                <button onClick={handleCopy} className="p-1 hover:bg-gray-100 rounded">
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          {/* Wallet Actions - Track + Alert */}
          <TrackWalletButton
            walletAddress={resolvedData.normalizedId}
            walletLabel={walletProfile?.summary?.headline || resolvedData.label}
            chain={resolvedData.chain || 'Ethereum'}
            onCreateAlert={onCreateAlert}
          />
        </div>
      </div>

      {/* Wallet Profile Card (B1) - if profile exists */}
      {walletProfile && (
        <WalletProfileCard profile={walletProfile} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats - Only if we have real data */}
          {walletData?.stats && (
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(walletData.stats).map(([key, value]) => (
                <div key={key} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          {walletData?.recentActivity && walletData.recentActivity.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {walletData.recentActivity.slice(0, 5).map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                      <div className="text-xs text-gray-500">{tx.timestamp}</div>
                    </div>
                    {tx.amount && (
                      <div className="text-sm font-semibold text-gray-900">{tx.amount}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              type="no_data"
              title="No recent activity"
              description="This wallet hasn't had any recorded transactions recently."
            />
          )}

          {/* Behavior Fingerprint - only with real data */}
          {walletData?.behaviorFingerprint && (
            <BehaviorFingerprint behavior={walletData.behaviorFingerprint} />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* B4: Smart Money Profile - Historical Performance */}
          {resolvedData?.normalizedId && (
            <SmartMoneyProfile 
              walletAddress={resolvedData.normalizedId}
              chain={resolvedData.chain || 'Ethereum'}
            />
          )}

          {/* B3: Related Addresses (Clusters) */}
          {resolvedData?.normalizedId && (
            <RelatedAddresses 
              walletAddress={resolvedData.normalizedId}
              chain={resolvedData.chain || 'Ethereum'}
              onWalletClick={handleWalletClick}
              onReviewCluster={handleReviewCluster}
            />
          )}

          {/* Data Availability */}
          {resolvedData?.available && (
            <DataAvailability 
              available={resolvedData.available}
              confidence={resolvedData.confidence}
            />
          )}

          {/* P0 FIX: REMOVED - confidence is NOT lifecycle status
          Low confidence is shown via ResolutionInfo and empty states, not as warning banner
          */}

          {/* Resolution Info */}
          <ResolutionInfo
            type={resolvedData.type}
            status={resolvedData.status}
            confidence={resolvedData.confidence}
            chain={resolvedData.chain}
            reason={resolvedData.reason}
          />

          {/* Reputation Card */}
          {resolvedData?.normalizedId && (
            <ReputationCard type="wallet" targetId={resolvedData.normalizedId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedData, setResolvedData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [walletProfile, setWalletProfile] = useState(null);

  // ========================================
  // FRONTEND CONTRACT (P0 FIX)
  // ========================================
  // ❌ ЗАПРЕЩЕНО НАВСЕГДА:
  //    if (confidence < X) showAnalyzing()
  //
  // ✅ ЕДИНСТВЕННОЕ ПРАВИЛО:
  //    if (status === 'analyzing' || status === 'pending') showAnalyzing()
  //    else showResult() // даже если данных нет
  // ========================================
  
  const isActuallyAnalyzing = resolvedData && (
    resolvedData.status === 'analyzing' || 
    resolvedData.status === 'pending'
  );
  
  // Terminal states - analysis finished (show results, even if empty)
  const isAnalysisComplete = resolvedData && (
    resolvedData.status === 'completed' ||
    resolvedData.status === 'failed'
  );
  
  // Empty state - address exists but no useful data
  const isEmpty = resolvedData && (
    resolvedData.status === 'not_found' ||
    resolvedData.status === 'error'
  );

  // Resolve wallet address
  const resolveWallet = useCallback(async (address) => {
    if (!address || address.length < 3) return;
    
    setLoading(true);
    setError(null);
    setResolvedData(null);
    setWalletData(null);
    setWalletProfile(null);
    
    try {
      const response = await resolverApi.resolve(address);
      
      if (response?.ok) {
        setResolvedData(response.data);
        
        // FIXED: Load additional data whenever resolved (even with low confidence)
        // Low confidence = partial data, but still show what we have
        if (response.data.status === 'resolved') {
          // Try to get B1 Wallet Profile first
          try {
            const profile = await walletsApi.getProfile(response.data.normalizedId);
            if (profile && !profile.error) {
              setWalletProfile(profile);
            }
          } catch (e) {
            console.log('B1 Wallet profile not available');
          }
          
          // Try to get legacy wallet-specific data
          try {
            const walletResponse = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/api/wallets/${response.data.normalizedId}/profile`
            );
            if (walletResponse.ok) {
              const walletJson = await walletResponse.json();
              if (walletJson.ok) {
                setWalletData(walletJson.data);
              }
            }
          } catch (e) {
            console.log('Legacy wallet profile not available');
          }
        }
      } else {
        setError(response?.error || 'Failed to resolve address');
      }
    } catch (err) {
      console.error('Failed to resolve wallet:', err);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      resolveWallet(searchQuery.trim());
    }
  };

  // Handle quick select
  const handleQuickSelect = (address) => {
    setSearchQuery(address);
    resolveWallet(address);
  };

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      resolveWallet(searchQuery.trim());
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="wallets-page">
        <Header />
        
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Status Banner */}
          <StatusBanner className="mb-4" compact />

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
              <p className="text-sm text-gray-500">
                Analyze any wallet address for behavior patterns and risk assessment
              </p>
            </div>
            {resolvedData && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* P1.2 FIX: Plain search input without icon */}
          <form onSubmit={handleSearch} className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter wallet address or ENS name..."
              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              data-testid="wallet-search-input"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </form>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Content */}
          {!resolvedData && !loading && (
            <div className="space-y-6">
              {/* Empty state with suggestions */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze any wallet</h3>
                <p className="text-gray-500 mb-6">
                  Enter an Ethereum address or ENS name to see behavior patterns
                </p>
              </div>

              {/* Quick Select Reference Wallets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Popular wallets to explore
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {REFERENCE_WALLETS.map((wallet) => (
                    <WalletQuickSelect 
                      key={wallet.address}
                      wallet={wallet}
                      onSelect={handleQuickSelect}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Click any wallet above to start analyzing
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Looking up wallet...</p>
              </div>
            </div>
          )}

          {/* Resolved Content */}
          {resolvedData && !loading && (
            <>
              {/* P0 FIX: Analyzing state - show progress */}
              {isActuallyAnalyzing && (
                <WalletIndexingState 
                  resolvedData={resolvedData}
                  onSetAlert={() => setShowAlertModal(true)}
                  onIndexingComplete={() => {
                    // Auto-refresh resolver when analysis completes
                    resolveWallet(searchQuery);
                  }}
                />
              )}

              {/* P0 FIX: Analysis complete - show results (even if sparse/empty) */}
              {isAnalysisComplete && (
                <WalletResolvedView 
                  resolvedData={resolvedData}
                  walletData={walletData}
                  walletProfile={walletProfile}
                  onCreateAlert={() => setShowAlertModal(true)}
                />
              )}
            </>
          )}
        </div>

        {/* Wallet Alert Modal - WORKING */}
        <CreateWalletAlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          walletAddress={resolvedData?.normalizedId}
          walletLabel={walletProfile?.summary?.headline || resolvedData?.label}
          chain={resolvedData?.chain || 'Ethereum'}
          onSuccess={() => {
            setShowAlertModal(false);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
