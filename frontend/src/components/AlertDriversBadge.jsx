/**
 * AlertDriversBadge (B2)
 * 
 * Compact badge showing "Driven by Wallet A and 1 more" in alert cards
 * 
 * Connects Phase A (Alerts) with Phase B2 (Wallet Correlation)
 */
import React, { useState, useEffect } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getAlertGroupDrivers } from '../api/wallets.api';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get role emoji
 */
const getRoleEmoji = (role) => {
  switch (role) {
    case 'buyer': return '📈';
    case 'seller': return '📉';
    default: return '📊';
  }
};

/**
 * Compact drivers badge for alert cards
 */
export function AlertDriversBadge({ 
  groupId, 
  onClick,
  className = '',
}) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!groupId) return;
    
    const fetchDrivers = async () => {
      try {
        const response = await getAlertGroupDrivers(groupId);
        if (response.ok && response.data) {
          setDrivers(response.data);
        }
      } catch (err) {
        console.error('Error fetching alert drivers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, [groupId]);
  
  if (loading) {
    return (
      <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
    );
  }
  
  if (!drivers || drivers.drivers?.length === 0) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${className}`}
            onClick={() => onClick?.(drivers)}
            data-testid="alert-drivers-badge"
          >
            <Users className="w-3 h-3 mr-1" />
            {drivers.driverSummary}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Activity Drivers</p>
            <div className="space-y-1">
              {drivers.drivers.slice(0, 3).map((driver, i) => (
                <div key={driver.walletAddress} className="flex items-center gap-2 text-sm">
                  <span>{getRoleEmoji(driver.role)}</span>
                  <span className="font-mono">{formatAddress(driver.walletAddress)}</span>
                  <span className="text-muted-foreground">
                    {Math.round(driver.influenceScore * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Expanded drivers panel for alert detail view
 */
export function AlertDriversPanel({ 
  groupId,
  onWalletClick,
  className = '',
}) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!groupId) return;
    
    const fetchDrivers = async () => {
      try {
        const response = await getAlertGroupDrivers(groupId);
        if (response.ok && response.data) {
          setDrivers(response.data);
        }
      } catch (err) {
        console.error('Error fetching alert drivers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, [groupId]);
  
  if (loading) {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }
  
  if (!drivers || drivers.drivers?.length === 0) {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center text-muted-foreground ${className}`}>
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No wallet drivers linked to this alert</p>
      </div>
    );
  }
  
  return (
    <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`} data-testid="alert-drivers-panel">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-sm">Activity Drivers</span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {drivers.driverSummary}
      </p>
      
      <div className="space-y-2">
        {drivers.drivers.map((driver) => (
          <div 
            key={driver.walletAddress}
            className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            onClick={() => onWalletClick?.(driver.walletAddress)}
          >
            <div className="flex items-center gap-2">
              <span>{getRoleEmoji(driver.role)}</span>
              <span className="font-mono text-sm">{formatAddress(driver.walletAddress)}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {driver.role}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">{Math.round(driver.influenceScore * 100)}%</span>
              <span className="text-muted-foreground ml-1">influence</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertDriversBadge;
