/**
 * EntitiesPage - REAL MODE (Phase 16)
 * Dynamic entity analytics with Universal Resolver
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Users, Info, ChevronLeft, ChevronRight, 
  Link2, X, Eye, Bell, Check, Search, Loader2, RefreshCw, Building,
  AlertCircle
} from 'lucide-react';
import Header from '../components/Header';
import SearchInput from '../components/shared/SearchInput';
import AlertModal from '../components/AlertModal';
import EmptyState from '../components/EmptyState';
import StatusBanner from '../components/StatusBanner';
import UniversalSearch from '../components/UniversalSearch';
import { AddressCountBadge } from '../components/KnownAddresses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { entitiesApi, resolverApi } from '../api';

// Known entities for quick start (when database is empty)
const KNOWN_ENTITIES = [
  { id: 'binance', name: 'Binance', type: 'Exchange', logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png' },
  { id: 'coinbase', name: 'Coinbase', type: 'Exchange', logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png' },
  { id: 'kraken', name: 'Kraken', type: 'Exchange', logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png' },
  { id: 'a16z', name: 'a16z Crypto', type: 'Smart Money', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'paradigm', name: 'Paradigm', type: 'Smart Money', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'pantera', name: 'Pantera Capital', type: 'Smart Money', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'jump', name: 'Jump Trading', type: 'Smart Money', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'galaxy', name: 'Galaxy Digital', type: 'Smart Money', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'grayscale', name: 'Grayscale', type: 'Fund', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
];

const activityConfig = {
  'accumulating': { label: 'Accumulating', color: 'bg-gray-900 text-white' },
  'distributing': { label: 'Distributing', color: 'bg-gray-100 text-gray-600' },
  'rotating': { label: 'Rotating', color: 'bg-gray-200 text-gray-700' },
  'holding': { label: 'Holding', color: 'bg-gray-100 text-gray-600' },
  'unknown': { label: 'Unknown', color: 'bg-gray-50 text-gray-400' },
};

const ITEMS_PER_PAGE = 9;

// Pagination Component
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6 py-4 border-t border-gray-100">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-teal-500 hover:bg-teal-50'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-teal-400 text-sm">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                currentPage === page ? 'bg-teal-500 text-white' : 'text-teal-500 hover:bg-teal-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-teal-500 hover:bg-teal-50'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{startItem} - {endItem}</span> out of <span className="font-semibold text-gray-700">{totalItems}</span>
      </div>
    </div>
  );
}

// Entity Card Component
function EntityCard({ entity, onAddToWatchlist, onCreateAlert, isInWatchlist, loading }) {
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Try to load real profile data
  useEffect(() => {
    async function loadProfile() {
      if (!entity.id) return;
      setProfileLoading(true);
      try {
        const response = await entitiesApi.getEntityProfile(entity.id);
        if (response?.ok) {
          setProfileData(response.data);
        }
      } catch (err) {
        // Silent fail - use mock data
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [entity.id]);

  const displayData = profileData || entity;
  const activity = displayData.activity || 'unknown';
  const confidence = displayData.confidence || displayData.trustScore;

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all hover:border-gray-900 ${
      loading ? 'opacity-50' : ''
    }`}>
      <Link to={`/entity/${entity.id}`} className="block">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={entity.logo || 'https://via.placeholder.com/48'} 
            alt={entity.name} 
            className="w-12 h-12 rounded-2xl bg-gray-100"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/48?text=' + entity.name?.charAt(0);
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{entity.name}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                {entity.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{displayData.addresses || displayData.addressCount || '—'} addresses</span>
            </div>
          </div>
          {profileLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Activity & Confidence */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${activityConfig[activity]?.color || activityConfig.unknown.color}`}>
            {activityConfig[activity]?.label || activity}
          </span>
          {/* Attribution Badge */}
          <AddressCountBadge subjectType="entity" subjectId={entity.id} />
        </div>

        {/* Holdings & Flow if available */}
        {(displayData.holdings || displayData.netflow24h) && (
          <div className="flex items-center gap-4 mb-4 text-xs">
            {displayData.holdings && (
              <div>
                <span className="text-gray-500">Holdings: </span>
                <span className="font-semibold text-gray-900">{displayData.holdings}</span>
              </div>
            )}
            {displayData.netflow24h && (
              <div>
                <span className="text-gray-500">24h Flow: </span>
                <span className={`font-semibold ${
                  displayData.netflow24h.startsWith('+') ? 'text-emerald-600' : 
                  displayData.netflow24h.startsWith('-') ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {displayData.netflow24h}
                </span>
              </div>
            )}
          </div>
        )}
      </Link>
      
      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Link to={`/entity/${entity.id}`} className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          View details →
        </Link>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToWatchlist?.(entity);
                }}
                className={`p-1.5 rounded transition-colors ${
                  isInWatchlist 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
                data-testid={`watchlist-btn-${entity.id}`}
              >
                {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCreateAlert?.(entity);
                }}
                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                data-testid={`alert-btn-${entity.id}`}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Create Alert</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// No Data Placeholder
function NoDataPlaceholder({ type, onSearch }) {
  return (
    <div className="col-span-full">
      <EmptyState
        type="no_data"
        title={`No ${type || 'entities'} found`}
        description="The system hasn't indexed any entities matching your criteria yet. Try searching for a specific entity or check back later."
        suggestions={[
          'Search by name or address',
          'Change the filter type',
          'Wait for system indexing'
        ]}
        action={{
          label: 'Search Entity',
          onClick: onSearch,
          icon: Search,
        }}
      />
    </div>
  );
}

export default function EntitiesPage() {
  const navigate = useNavigate();
  
  // State
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState(null);
  
  // Watchlist & Alerts
  const [watchlist, setWatchlist] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEntity, setAlertEntity] = useState('');

  // Load entities from API
  const loadEntities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get entities from API
      // Note: The API might not have a list endpoint, so we use known entities as fallback
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.data?.length > 0) {
          setEntities(data.data);
          return;
        }
      }
      
      // Fallback to known entities
      setEntities(KNOWN_ENTITIES);
    } catch (err) {
      console.error('Failed to load entities:', err);
      // Use known entities as fallback
      setEntities(KNOWN_ENTITIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // Filter entities
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || entity.type === filterType;
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEntities = filteredEntities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handlers
  const handleAddToWatchlist = (entity) => {
    setWatchlist(prev => {
      if (prev.includes(entity.id)) {
        return prev.filter(id => id !== entity.id);
      }
      return [...prev, entity.id];
    });
  };

  const handleCreateAlert = (entity) => {
    setAlertEntity(entity.name);
    setShowAlertModal(true);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    loadEntities();
  };

  // Get unique types for filter
  const entityTypes = ['all', ...new Set(entities.map(e => e.type).filter(Boolean))];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <Header />
        
        <div className="px-4 py-6">
          {/* Status Banner */}
          <StatusBanner className="mb-4" compact />
          
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Entities</h1>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
                    <p className="text-xs">Entity = group of addresses controlled by single actor. Track exchanges, funds, and market makers — their aggregate influence on the market.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search Entity
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">Track exchanges, funds, and market makers — their holdings, flows, and market impact</p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search entities..."
              className="max-w-md"
              testId="entities-search-input"
            />
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
              {entityTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterType === type ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Entities Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : paginatedEntities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedEntities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  onAddToWatchlist={handleAddToWatchlist}
                  onCreateAlert={handleCreateAlert}
                  isInWatchlist={watchlist.includes(entity.id)}
                />
              ))}
            </div>
          ) : (
            <NoDataPlaceholder 
              type={filterType === 'all' ? 'entities' : filterType}
              onSearch={() => setShowSearch(true)}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEntities.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          )}

          {/* Data Source Notice */}
          {!loading && entities === KNOWN_ENTITIES && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-900">Using reference data</div>
                  <p className="text-sm text-amber-700 mt-1">
                    Showing known entities as placeholders. Real entity profiles will load as you explore individual entities or as the system indexes more data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowSearch(false)}
        >
          <div 
            className="bg-white rounded-2xl p-4 shadow-2xl max-w-lg w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <UniversalSearch 
              onClose={() => setShowSearch(false)}
              placeholder="Search by name, address, or ENS..."
              autoFocus
            />
          </div>
        </div>
      )}
      
      {/* Alert Modal */}
      <AlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        defaultEntity={alertEntity}
      />
    </TooltipProvider>
  );
}
