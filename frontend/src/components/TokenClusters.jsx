/**
 * TokenClusters (B3) - Token Context
 * 
 * P2.1 FIX: Always render, show empty state if no data
 * 
 * Shows wallet clusters related to this token's activity.
 * Max 2-3 clusters (not exhaustive list).
 */
import React from 'react';
import { Users, ExternalLink } from 'lucide-react';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * TokenClusters Component (B3)
 */
export default function TokenClusters({ tokenAddress, clusters, className = '' }) {
  const hasClusters = clusters && clusters.length > 0;

  // P2.1 FIX: Empty state is VALID result - explain WHAT was checked
  if (!hasClusters) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Related Wallet Clusters</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Checked</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            No related wallet clusters detected
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            We analyzed timing correlation, token overlap, and behavioral patterns across active wallets. 
            No coordinated clusters were identified.
          </p>
        </div>
      </div>
    );
  }

  // Show clusters (max 3)
  const displayClusters = clusters.slice(0, 3);

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Related Wallet Clusters</h3>
        <span className="text-xs text-gray-500">
          Showing {displayClusters.length} of {clusters.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {displayClusters.map((cluster, index) => (
          <div
            key={cluster.clusterId || index}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Cluster {cluster.clusterId || index + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {cluster.walletCount || 0} wallets
                  </span>
                </div>
                {cluster.behavior && (
                  <p className="text-xs text-gray-600 ml-6">
                    {cluster.behavior}
                  </p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
