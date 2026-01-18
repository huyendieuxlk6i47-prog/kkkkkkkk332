/**
 * TokenSmartMoney (B4) - Token Context
 * 
 * P2.1 FIX: Always render, show empty state if no data
 * 
 * Shows smart money activity patterns for this token.
 */
import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

/**
 * TokenSmartMoney Component (B4)
 */
export default function TokenSmartMoney({ tokenAddress, smartMoneyData, className = '' }) {
  const hasData = smartMoneyData && (
    smartMoneyData.count > 0 || 
    smartMoneyData.totalValue > 0
  );

  // P2.1 FIX: Empty state is VALID result - explain WHAT was checked
  if (!hasData) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Smart Money Activity</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Checked</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            No smart money patterns identified
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            We checked historically profitable wallets for interaction with this token. 
            No qualifying activity was found.
          </p>
        </div>
      </div>
    );
  }

  // Show smart money data
  const { count, totalValue, recentActivity, performance } = smartMoneyData;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Smart Money Activity</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
          {count} wallets
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Total Value */}
        {totalValue > 0 && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Total Volume</span>
              <span className="text-sm font-medium text-gray-900">
                ${totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        {/* Recent Activity */}
        {recentActivity && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">
                Recent Activity
              </span>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              {recentActivity}
            </p>
          </div>
        )}
        
        {/* Performance */}
        {performance && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Avg Performance</span>
              <span className={`text-sm font-medium ${
                performance > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {performance > 0 ? '+' : ''}{performance}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
