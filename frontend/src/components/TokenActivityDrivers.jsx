/**
 * TokenActivityDrivers (B2)
 * 
 * UI component: "Who is driving this activity?"
 * 
 * Shows wallet drivers on Token Page with:
 * - Top participants with roles
 * - Influence scores
 * - Human-readable summary
 * - Links to wallet profiles
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, TrendingDown, Activity, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getTokenDrivers, calculateTokenDrivers } from '../api/wallets.api';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format large numbers
 */
const formatNumber = (num) => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

/**
 * Get role badge color and icon
 */
const getRoleDisplay = (role) => {
  switch (role) {
    case 'buyer':
      return {
        color: 'bg-green-500/10 text-green-600 border-green-500/20',
        icon: TrendingUp,
        label: 'Buyer',
        description: 'Primarily accumulating',
      };
    case 'seller':
      return {
        color: 'bg-red-500/10 text-red-600 border-red-500/20',
        icon: TrendingDown,
        label: 'Seller',
        description: 'Primarily distributing',
      };
    default:
      return {
        color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        icon: Activity,
        label: 'Mixed',
        description: 'Both buying and selling',
      };
  }
};

/**
 * Get confidence badge
 */
const getConfidenceBadge = (confidence) => {
  if (confidence >= 0.7) {
    return { label: 'High', color: 'bg-green-100 text-green-700' };
  } else if (confidence >= 0.4) {
    return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
  }
  return { label: 'Low', color: 'bg-gray-100 text-gray-600' };
};

/**
 * Single Driver Card
 */
const DriverCard = ({ driver, rank, onWalletClick }) => {
  const roleDisplay = getRoleDisplay(driver.role);
  const RoleIcon = roleDisplay.icon;
  const confidenceBadge = getConfidenceBadge(driver.confidence);
  
  return (
    <div 
      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      onClick={() => onWalletClick?.(driver.walletAddress)}
      data-testid={`driver-card-${rank}`}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
          {rank}
        </div>
        
        {/* Wallet info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">
              {formatAddress(driver.walletAddress)}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className={`text-xs ${roleDisplay.color}`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleDisplay.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{roleDisplay.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Wallet tags if available */}
          {driver.walletMeta?.tags?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {driver.walletMeta.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Metrics */}
      <div className="flex items-center gap-4 text-right">
        {/* Influence Score */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div>
                <div className="text-xs text-muted-foreground">Influence</div>
                <div className="font-semibold text-sm">
                  {Math.round(driver.influenceScore * 100)}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Combined score based on volume, activity, and timing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Volume Share */}
        <div>
          <div className="text-xs text-muted-foreground">Volume</div>
          <div className="text-sm">
            {Math.round(driver.volumeShare * 100)}%
          </div>
        </div>
        
        {/* Transactions */}
        <div className="hidden sm:block">
          <div className="text-xs text-muted-foreground">Txs</div>
          <div className="text-sm">{driver.txCount}</div>
        </div>
        
        {/* Confidence */}
        <Badge className={`${confidenceBadge.color} text-xs hidden md:inline-flex`}>
          {confidenceBadge.label}
        </Badge>
        
        {/* External link */}
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

/**
 * Main TokenActivityDrivers Component
 */
export function TokenActivityDrivers({ 
  tokenAddress, 
  chain = 'Ethereum',
  onWalletClick,
  className = '',
}) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDrivers = useCallback(async () => {
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTokenDrivers(tokenAddress, chain, 5);
      if (response.ok) {
        setDrivers(response.data);
      } else {
        setError(response.error || 'Failed to load drivers');
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load activity drivers');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, chain]);
  
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);
  
  const handleRefresh = async () => {
    setCalculating(true);
    try {
      await calculateTokenDrivers(tokenAddress, chain, 24);
      await fetchDrivers();
    } catch (err) {
      console.error('Error calculating drivers:', err);
    } finally {
      setCalculating(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who is driving this activity?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who is driving this activity?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!drivers || drivers.topDrivers?.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Who is driving this activity?
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={calculating}
            >
              <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No significant wallet activity detected</p>
            <p className="text-sm mt-1">Activity analysis requires recent token transfers</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className} data-testid="token-activity-drivers">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Who is driving this activity?
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={calculating}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            {drivers.summary?.headline || 'Activity analysis in progress'}
          </p>
          {drivers.summary?.description && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {drivers.summary.description}
            </p>
          )}
        </div>
        
        {/* Top Participants Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Top Participants
          </h4>
          <Badge variant="outline" className="text-xs">
            {drivers.totalParticipants} total
          </Badge>
        </div>
        
        {/* Driver List */}
        <div className="space-y-2">
          {drivers.topDrivers.map((driver, index) => (
            <DriverCard
              key={driver.walletAddress}
              driver={driver}
              rank={index + 1}
              onWalletClick={onWalletClick}
            />
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onWalletClick?.(drivers.topDrivers[0]?.walletAddress)}
          >
            View Top Wallet Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TokenActivityDrivers;
