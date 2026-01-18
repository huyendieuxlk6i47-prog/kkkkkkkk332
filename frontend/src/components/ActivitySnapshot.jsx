/**
 * ActivitySnapshot - КРИТИЧЕСКИ ВАЖНЫЙ БЛОК (Section 2)
 * 
 * CONTRACT:
 * - ВСЕГДА рендерится когда status === 'completed'
 * - Показывает ЧТО было проверено системой
 * - Даже если всё = 0, это ВАЛИДНЫЙ результат
 * - Никаких spinner'ов после completed
 * 
 * Метрики:
 * - Net Flow (24h)
 * - Inflow / Outflow
 * - Active Wallets (24h)
 * - Transfers Count
 * - Largest Transfer
 * - Time Range analyzed
 */
import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ArrowLeftRight,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

/**
 * Format large numbers for display
 */
const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '—';
  if (num === 0) return '0';
  
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

/**
 * Format USD value
 */
const formatUSD = (value) => {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '$0';
  
  if (Math.abs(value) >= 1e9) {
    return '$' + (value / 1e9).toFixed(2) + 'B';
  }
  if (Math.abs(value) >= 1e6) {
    return '$' + (value / 1e6).toFixed(2) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return '$' + (value / 1e3).toFixed(1) + 'K';
  }
  return '$' + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Single Metric Card
 */
const MetricCard = ({ icon: Icon, label, value, subValue, iconColor = 'text-gray-500' }) => (
  <div className="p-3 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
    <div className="text-xl font-bold text-gray-900">
      {value}
    </div>
    {subValue && (
      <div className="text-xs text-gray-500 mt-0.5">
        {subValue}
      </div>
    )}
  </div>
);

/**
 * Net Flow Card with directional indicator
 */
const NetFlowCard = ({ netFlow, inflow, outflow }) => {
  const isPositive = netFlow >= 0;
  const hasData = netFlow !== null && netFlow !== undefined;
  
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs font-medium text-gray-600">Net Flow (24h)</span>
      </div>
      <div className={`text-xl font-bold ${
        !hasData ? 'text-gray-900' :
        isPositive ? 'text-emerald-600' : 'text-red-600'
      }`}>
        {hasData ? (
          <>
            {isPositive ? '+' : ''}{formatUSD(netFlow)}
          </>
        ) : '0'}
      </div>
      {(inflow !== undefined || outflow !== undefined) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span className="text-emerald-600">↑ {formatUSD(inflow || 0)}</span>
          <span>/</span>
          <span className="text-red-600">↓ {formatUSD(outflow || 0)}</span>
        </div>
      )}
    </div>
  );
};

/**
 * ActivitySnapshot Component
 * 
 * ALWAYS renders when status === 'completed'
 * Shows what the system checked, even if results are empty
 */
export default function ActivitySnapshot({ 
  marketContext, 
  resolvedData,
  timeWindow = '24h',
  className = '' 
}) {
  // Extract metrics from marketContext
  const activity = marketContext?.activity || {};
  const flows = marketContext?.flows || {};
  
  const transfers24h = activity.transfers24h ?? 0;
  const activeWallets = activity.activeWallets ?? 0;
  const largestTransfer = activity.largestTransfer ?? null;
  const netFlow = flows.netFlow ?? 0;
  const inflow = flows.inflow ?? 0;
  const outflow = flows.outflow ?? 0;
  
  // Determine if we have ANY activity
  const hasAnyActivity = transfers24h > 0 || activeWallets > 0 || netFlow !== 0;
  
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}
      data-testid="activity-snapshot"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Activity Snapshot</h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {timeWindow} window
        </span>
      </div>
      
      {/* Metrics Grid - ALWAYS shown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {/* Net Flow */}
        <NetFlowCard 
          netFlow={netFlow}
          inflow={inflow}
          outflow={outflow}
        />
        
        {/* Active Wallets */}
        <MetricCard
          icon={Wallet}
          label="Active Wallets"
          value={formatNumber(activeWallets)}
          subValue="unique addresses"
        />
        
        {/* Transfers */}
        <MetricCard
          icon={ArrowLeftRight}
          label="Transfers"
          value={formatNumber(transfers24h)}
          subValue="total transactions"
        />
        
        {/* Largest Transfer */}
        <MetricCard
          icon={TrendingUp}
          label="Largest Transfer"
          value={largestTransfer ? formatUSD(largestTransfer) : '—'}
          subValue={largestTransfer ? 'single tx' : 'no large transfers'}
        />
        
        {/* Analyzed Window */}
        <MetricCard
          icon={Clock}
          label="Analyzed Window"
          value={timeWindow === '24h' ? 'Last 24h' : timeWindow}
          subValue="time range"
        />
      </div>
      
      {/* Interpretation Footer - CRITICAL for user understanding */}
      <div className={`p-3 rounded-lg ${
        hasAnyActivity 
          ? 'bg-blue-50 border border-blue-100' 
          : 'bg-gray-50 border border-gray-100'
      }`}>
        {hasAnyActivity ? (
          <p className="text-xs text-blue-700">
            <span className="font-medium">Analysis complete.</span>{' '}
            We analyzed on-chain transfers for this token and detected activity in the selected time window.
            {activeWallets > 0 && ` ${formatNumber(activeWallets)} unique wallets participated.`}
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Analysis complete.</span>{' '}
            We analyzed recent on-chain transfers for this token but detected no activity in the selected time window.
            This is a valid result — the token may have low trading volume or be newly listed.
          </p>
        )}
      </div>
    </div>
  );
}
