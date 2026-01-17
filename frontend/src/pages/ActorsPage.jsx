import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, Filter, Zap, Clock,
  ArrowUpDown, Eye, EyeOff, GitBranch, Users
} from 'lucide-react';
import Header from '../components/Header';
import SearchInput from '../components/shared/SearchInput';
import StatusBanner from '../components/StatusBanner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  ActorCard,
  actorsData,
  chainConfig,
  strategyFilters,
  riskFilters,
  latencyFilters,
  sortOptions,
} from '../components/actors';
import EnhancedActorCard from '../components/actors/EnhancedActorCard';

export default function ActorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [followedOnly, setFollowedOnly] = useState(false);
  const [activeSignalsOnly, setActiveSignalsOnly] = useState(false);
  const [earlyOnly, setEarlyOnly] = useState(false);
  const [followedActors, setFollowedActors] = useState(['alameda', 'a16z']);
  const [sortBy, setSortBy] = useState('edgeScore');
  const [showRealNames, setShowRealNames] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [selectedRisk, setSelectedRisk] = useState([]);
  const [selectedLatency, setSelectedLatency] = useState([]);
  const [minWinRate, setMinWinRate] = useState(0);
  const [pnlPositiveOnly, setPnlPositiveOnly] = useState(false);

  const toggleFollow = (actorId) => {
    setFollowedActors(prev => 
      prev.includes(actorId) 
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    );
  };

  const toggleStrategy = (strategy) => {
    setSelectedStrategies(prev =>
      prev.includes(strategy) ? prev.filter(s => s !== strategy) : [...prev, strategy]
    );
  };

  const toggleRisk = (risk) => {
    setSelectedRisk(prev =>
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  const filteredActors = useMemo(() => {
    let result = actorsData.filter(actor => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRealName = actor.real_name.toLowerCase().includes(query);
        const matchesStrategyName = actor.strategy_name.toLowerCase().includes(query);
        const matchesStrategy = actor.strategies.some(s => s.toLowerCase().includes(query));
        const matchesToken = actor.tokens.some(t => t.toLowerCase().includes(query));
        const matchesType = actor.type.toLowerCase().includes(query);
        const matchesAddress = actor.address.toLowerCase().includes(query);
        if (!matchesRealName && !matchesStrategyName && !matchesStrategy && !matchesToken && !matchesType && !matchesAddress) return false;
      }
      if (followedOnly && !followedActors.includes(actor.id)) return false;
      if (activeSignalsOnly && !actor.hasActiveSignals) return false;
      if (earlyOnly && actor.latency !== 'Early') return false;
      if (selectedStrategies.length > 0 && !actor.strategies.some(s => selectedStrategies.includes(s))) return false;
      if (selectedRisk.length > 0) {
        const riskLevel = actor.riskScore < 30 ? 'Low' : actor.riskScore < 60 ? 'Medium' : 'High';
        if (!selectedRisk.includes(riskLevel)) return false;
      }
      if (selectedLatency.length > 0 && !selectedLatency.includes(actor.latency)) return false;
      if (minWinRate > 0 && actor.winRate < minWinRate) return false;
      if (pnlPositiveOnly && !actor.pnl.startsWith('+')) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'edgeScore': return b.edgeScore - a.edgeScore;
        case 'influence': return (b.influenceScore || 0) - (a.influenceScore || 0);
        case 'activity': return a.lastActivityTime - b.lastActivityTime;
        case 'pnl':
          const pnlA = parseFloat(a.pnl.replace(/[^0-9.-]/g, ''));
          const pnlB = parseFloat(b.pnl.replace(/[^0-9.-]/g, ''));
          return pnlB - pnlA;
        case 'winRate': return b.winRate - a.winRate;
        case 'risk': return a.riskScore - b.riskScore;
        case 'signals': return b.signalsCount - a.signalsCount;
        default: return 0;
      }
    });
    return result;
  }, [searchQuery, followedOnly, followedActors, selectedStrategies, selectedRisk, selectedLatency, minWinRate, pnlPositiveOnly, activeSignalsOnly, earlyOnly, sortBy]);

  const clearFilters = () => {
    setSelectedStrategies([]);
    setSelectedRisk([]);
    setSelectedLatency([]);
    setMinWinRate(0);
    setPnlPositiveOnly(false);
  };

  const hasActiveFilters = selectedStrategies.length > 0 || selectedRisk.length > 0 || selectedLatency.length > 0 || minWinRate > 0 || pnlPositiveOnly;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="actors-page">
        <Header />
        
        <div className="px-4 py-6 max-w-[1600px] mx-auto">
          {/* Status Banner */}
          <StatusBanner className="mb-4" compact />

          {/* Hero Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Actors</h1>
              <p className="text-sm text-gray-500">Proven on-chain operators & strategies</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSignalsOnly(!activeSignalsOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeSignalsOnly ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />Active signals
              </button>

              <button
                onClick={() => setEarlyOnly(!earlyOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  earlyOnly ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />Early only
              </button>

              <button
                onClick={() => setFollowedOnly(!followedOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  followedOnly ? 'bg-amber-100 text-amber-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${followedOnly ? 'fill-current' : ''}`} />Followed
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  showFilters || hasActiveFilters ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />Filters
                {hasActiveFilters && (
                  <span className="w-4 h-4 bg-white text-gray-900 rounded-full text-xs font-bold flex items-center justify-center">
                    {selectedStrategies.length + selectedRisk.length + selectedLatency.length + (minWinRate > 0 ? 1 : 0) + (pnlPositiveOnly ? 1 : 0)}
                  </span>
                )}
              </button>
              
              {/* Identity Toggle */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 ml-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowRealNames(false)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        !showRealNames ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      data-testid="show-strategies-btn"
                    >
                      <EyeOff className="w-3.5 h-3.5" />Strategies
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white max-w-xs">
                    <p className="text-xs">Focus on strategy patterns, not personalities.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowRealNames(true)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        showRealNames ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      data-testid="show-real-names-btn"
                    >
                      <Eye className="w-3.5 h-3.5" />Real Names
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white max-w-xs">
                    <p className="text-xs">Show known entity names for high-confidence identifications.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Link
                to="/actors/correlation"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors ml-2"
                data-testid="influence-graph-link"
              >
                <GitBranch className="w-3.5 h-3.5" />Influence Graph
              </Link>
            </div>
          </div>

          {/* Search Bar + Sort */}
          <div className="flex items-center gap-4 mb-6">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by behavior, strategy, token, address..."
              className="flex-1"
              testId="actors-search-input"
            />
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-gray-900"
                data-testid="actors-sort-select"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6" data-testid="actors-filters-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-900">
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Strategy */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Strategy</label>
                  <div className="flex flex-wrap gap-1.5">
                    {strategyFilters.map(strategy => (
                      <button
                        key={strategy}
                        onClick={() => toggleStrategy(strategy)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedStrategies.includes(strategy) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {strategy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Performance</label>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Win rate &gt; {minWinRate}%</label>
                      <input type="range" min="0" max="80" step="10" value={minWinRate} onChange={(e) => setMinWinRate(Number(e.target.value))} className="w-full" />
                    </div>
                    <button
                      onClick={() => setPnlPositiveOnly(!pnlPositiveOnly)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        pnlPositiveOnly ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      PnL positive only
                    </button>
                  </div>
                </div>

                {/* Risk */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk</label>
                  <div className="flex flex-wrap gap-1.5">
                    {riskFilters.map(risk => (
                      <button
                        key={risk}
                        onClick={() => toggleRisk(risk)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedRisk.includes(risk)
                            ? risk === 'Low' ? 'bg-[#16C784] text-white' : risk === 'Medium' ? 'bg-[#F5A524] text-white' : 'bg-[#EF4444] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Latency */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Latency</label>
                  <div className="flex flex-wrap gap-1.5">
                    {latencyFilters.map(latency => (
                      <button
                        key={latency}
                        onClick={() => setSelectedLatency(prev => 
                          prev.includes(latency) ? prev.filter(l => l !== latency) : [...prev, latency]
                        )}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedLatency.includes(latency)
                            ? latency === 'Early' ? 'bg-emerald-500 text-white' : latency === 'Medium' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {latency}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chain */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Primary Chain</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(chainConfig).map(([chain, config]) => (
                      <button key={chain} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />{chain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filteredActors.length}</span> actors
              {followedOnly && <span className="text-amber-600"> (followed only)</span>}
              {activeSignalsOnly && <span className="text-emerald-600"> (with active signals)</span>}
              {earlyOnly && <span className="text-emerald-600"> (early latency)</span>}
            </p>
          </div>

          {/* Actor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredActors.map(actor => (
              <EnhancedActorCard
                key={actor.id}
                actor={actor}
                isFollowed={followedActors.includes(actor.id)}
                onToggleFollow={toggleFollow}
                showRealNames={showRealNames}
              />
            ))}
          </div>

          {/* Empty state */}
          {filteredActors.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No actors found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  clearFilters();
                  setFollowedOnly(false);
                  setActiveSignalsOnly(false);
                  setEarlyOnly(false);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Reference Data Notice */}
          {filteredActors.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-900">Using reference data</div>
                  <p className="text-sm text-amber-700 mt-1">
                    Showing pre-indexed actor profiles. Real-time actor discovery and tracking will populate as the system indexes more on-chain activity.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
