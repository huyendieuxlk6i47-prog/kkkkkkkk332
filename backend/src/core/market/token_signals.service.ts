/**
 * Token Signals Service
 * Generates signals based on deviation from baseline activity
 * 
 * Signal Types:
 * - accumulation: Large wallets buying consistently
 * - distribution: Holders selling to market
 * - large_move: Single large transfer
 * - activity_spike: Sudden increase in activity
 * - smart_money_entry: Known profitable wallets entering
 * - smart_money_exit: Known profitable wallets exiting
 */

import { ERC20LogModel } from '../../onchain/ethereum/logs_erc20.model.js';

// Baseline period (hours)
const BASELINE_HOURS = 168; // 7 days
const CURRENT_WINDOW_HOURS = 1; // Compare last 1h vs baseline

// Signal thresholds
const THRESHOLDS = {
  activitySpike: 2.0, // 2x baseline = spike
  largeTransfer: 0.01, // Top 1% of transfers
  accumulationRatio: 0.7, // 70%+ of flow to few wallets
  distributionRatio: 0.7, // 70%+ of flow from few wallets
};

export interface TokenSignal {
  type: string;
  severity: number; // 0-100
  confidence: number; // 0-1
  title: string;
  description: string;
  evidence: {
    metric: string;
    baseline: number;
    current: number;
    deviation: number;
  };
  timestamp: Date;
}

/**
 * Calculate baseline metrics for a token
 */
async function calculateBaseline(tokenAddress: string): Promise<{
  avgTransfersPerHour: number;
  avgWalletsPerHour: number;
  avgVolumePerHour: number;
  p99TransferAmount: number;
}> {
  const since = new Date(Date.now() - BASELINE_HOURS * 60 * 60 * 1000);
  
  const stats = await ERC20LogModel.aggregate([
    { $match: { 
      token: tokenAddress,
      blockTimestamp: { $gte: since }
    }},
    { $group: {
      _id: null,
      totalTransfers: { $sum: 1 },
      totalAmount: { $sum: { $toDouble: '$amount' } },
      amounts: { $push: { $toDouble: '$amount' } },
      senders: { $addToSet: '$from' },
      receivers: { $addToSet: '$to' },
    }},
    { $project: {
      totalTransfers: 1,
      totalAmount: 1,
      amounts: 1,
      uniqueWallets: { $size: { $setUnion: ['$senders', '$receivers'] } }
    }}
  ]);
  
  if (!stats[0]) {
    return {
      avgTransfersPerHour: 0,
      avgWalletsPerHour: 0,
      avgVolumePerHour: 0,
      p99TransferAmount: 0,
    };
  }
  
  const data = stats[0];
  const hours = BASELINE_HOURS;
  
  // Calculate P99 transfer amount
  const amounts = data.amounts || [];
  amounts.sort((a: number, b: number) => a - b);
  const p99Index = Math.floor(amounts.length * 0.99);
  const p99Amount = amounts[p99Index] || 0;
  
  return {
    avgTransfersPerHour: data.totalTransfers / hours,
    avgWalletsPerHour: data.uniqueWallets / hours,
    avgVolumePerHour: data.totalAmount / hours,
    p99TransferAmount: p99Amount,
  };
}

/**
 * Get current window metrics
 */
async function getCurrentMetrics(tokenAddress: string): Promise<{
  transfers: number;
  wallets: number;
  volume: number;
  largestTransfer: number;
  topReceivers: { wallet: string; amount: number }[];
  topSenders: { wallet: string; amount: number }[];
}> {
  const since = new Date(Date.now() - CURRENT_WINDOW_HOURS * 60 * 60 * 1000);
  
  const [stats, topReceivers, topSenders, largest] = await Promise.all([
    // Basic stats
    ERC20LogModel.aggregate([
      { $match: { token: tokenAddress, blockTimestamp: { $gte: since } }},
      { $group: {
        _id: null,
        transfers: { $sum: 1 },
        volume: { $sum: { $toDouble: '$amount' } },
        senders: { $addToSet: '$from' },
        receivers: { $addToSet: '$to' },
      }},
      { $project: {
        transfers: 1,
        volume: 1,
        wallets: { $size: { $setUnion: ['$senders', '$receivers'] } }
      }}
    ]),
    
    // Top receivers (accumulators)
    ERC20LogModel.aggregate([
      { $match: { token: tokenAddress, blockTimestamp: { $gte: since } }},
      { $group: { _id: '$to', amount: { $sum: { $toDouble: '$amount' } } }},
      { $sort: { amount: -1 }},
      { $limit: 10 },
      { $project: { wallet: '$_id', amount: 1, _id: 0 }}
    ]),
    
    // Top senders (distributors)
    ERC20LogModel.aggregate([
      { $match: { token: tokenAddress, blockTimestamp: { $gte: since } }},
      { $group: { _id: '$from', amount: { $sum: { $toDouble: '$amount' } } }},
      { $sort: { amount: -1 }},
      { $limit: 10 },
      { $project: { wallet: '$_id', amount: 1, _id: 0 }}
    ]),
    
    // Largest single transfer
    ERC20LogModel.findOne({ 
      token: tokenAddress, 
      blockTimestamp: { $gte: since } 
    }).sort({ amount: -1 }).limit(1),
  ]);
  
  const data = stats[0] || { transfers: 0, wallets: 0, volume: 0 };
  
  return {
    transfers: data.transfers,
    wallets: data.wallets,
    volume: data.volume,
    largestTransfer: largest ? parseFloat(largest.amount) : 0,
    topReceivers: topReceivers as any[],
    topSenders: topSenders as any[],
  };
}

/**
 * Generate signals for a token
 */
export async function generateTokenSignals(tokenAddress: string): Promise<TokenSignal[]> {
  const normalizedAddress = tokenAddress.toLowerCase();
  const signals: TokenSignal[] = [];
  
  const [baseline, current] = await Promise.all([
    calculateBaseline(normalizedAddress),
    getCurrentMetrics(normalizedAddress),
  ]);
  
  // No baseline = no signals
  if (baseline.avgTransfersPerHour === 0) {
    return [];
  }
  
  const now = new Date();
  
  // 1. ACTIVITY SPIKE
  const transferDeviation = current.transfers / (baseline.avgTransfersPerHour * CURRENT_WINDOW_HOURS);
  if (transferDeviation >= THRESHOLDS.activitySpike) {
    signals.push({
      type: 'activity_spike',
      severity: Math.min(100, Math.round(transferDeviation * 30)),
      confidence: Math.min(0.95, 0.5 + (transferDeviation - 2) * 0.1),
      title: 'Activity Spike Detected',
      description: `Transfer activity is ${transferDeviation.toFixed(1)}x higher than the 7-day average.`,
      evidence: {
        metric: 'transfers_per_hour',
        baseline: baseline.avgTransfersPerHour,
        current: current.transfers / CURRENT_WINDOW_HOURS,
        deviation: transferDeviation,
      },
      timestamp: now,
    });
  }
  
  // 2. LARGE TRANSFER
  if (current.largestTransfer > baseline.p99TransferAmount && baseline.p99TransferAmount > 0) {
    const magnitude = current.largestTransfer / baseline.p99TransferAmount;
    signals.push({
      type: 'large_move',
      severity: Math.min(100, Math.round(magnitude * 20)),
      confidence: 0.9,
      title: 'Unusual Large Transfer Detected',
      description: `A transfer ${magnitude.toFixed(1)}x larger than typical was detected.`,
      evidence: {
        metric: 'largest_transfer',
        baseline: baseline.p99TransferAmount,
        current: current.largestTransfer,
        deviation: magnitude,
      },
      timestamp: now,
    });
  }
  
  // 3. ACCUMULATION (concentration of receiving)
  if (current.topReceivers.length > 0 && current.volume > 0) {
    const top3Volume = current.topReceivers.slice(0, 3).reduce((sum, r) => sum + r.amount, 0);
    const concentrationRatio = top3Volume / current.volume;
    
    if (concentrationRatio >= THRESHOLDS.accumulationRatio) {
      signals.push({
        type: 'accumulation',
        severity: Math.round(concentrationRatio * 80),
        confidence: 0.7 + concentrationRatio * 0.2,
        title: 'Consistent Buying Detected',
        description: `Top 3 wallets received ${(concentrationRatio * 100).toFixed(0)}% of all tokens in the last hour.`,
        evidence: {
          metric: 'receiving_concentration',
          baseline: 0.33, // Expected even distribution
          current: concentrationRatio,
          deviation: concentrationRatio / 0.33,
        },
        timestamp: now,
      });
    }
  }
  
  // 4. DISTRIBUTION (concentration of sending)
  if (current.topSenders.length > 0 && current.volume > 0) {
    const top3Volume = current.topSenders.slice(0, 3).reduce((sum, s) => sum + s.amount, 0);
    const concentrationRatio = top3Volume / current.volume;
    
    if (concentrationRatio >= THRESHOLDS.distributionRatio) {
      signals.push({
        type: 'distribution',
        severity: Math.round(concentrationRatio * 80),
        confidence: 0.7 + concentrationRatio * 0.2,
        title: 'Increasing Selling Detected',
        description: `Top 3 wallets sent ${(concentrationRatio * 100).toFixed(0)}% of all tokens in the last hour.`,
        evidence: {
          metric: 'sending_concentration',
          baseline: 0.33,
          current: concentrationRatio,
          deviation: concentrationRatio / 0.33,
        },
        timestamp: now,
      });
    }
  }
  
  return signals;
}

/**
 * Get top wallets driving activity (for B2 block)
 */
export async function getActivityDrivers(tokenAddress: string, limit: number = 10): Promise<{
  topDrivers: {
    wallet: string;
    role: 'accumulator' | 'distributor' | 'mixed';
    volumeIn: number;
    volumeOut: number;
    netFlow: number;
    influence: number; // % of total volume
  }[];
  totalVolume: number;
  hasConcentration: boolean;
}> {
  const normalizedAddress = tokenAddress.toLowerCase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h
  
  // Get volume per wallet (both in and out)
  const walletStats = await ERC20LogModel.aggregate([
    { $match: { token: normalizedAddress, blockTimestamp: { $gte: since } }},
    { $facet: {
      incoming: [
        { $group: { _id: '$to', amount: { $sum: { $toDouble: '$amount' } } }}
      ],
      outgoing: [
        { $group: { _id: '$from', amount: { $sum: { $toDouble: '$amount' } } }}
      ],
      total: [
        { $group: { _id: null, volume: { $sum: { $toDouble: '$amount' } } }}
      ]
    }}
  ]);
  
  const incoming = walletStats[0]?.incoming || [];
  const outgoing = walletStats[0]?.outgoing || [];
  const totalVolume = walletStats[0]?.total?.[0]?.volume || 0;
  
  // Merge into single wallet map
  const walletMap = new Map<string, { in: number; out: number }>();
  
  for (const w of incoming) {
    walletMap.set(w._id, { in: w.amount, out: 0 });
  }
  
  for (const w of outgoing) {
    const existing = walletMap.get(w._id) || { in: 0, out: 0 };
    existing.out = w.amount;
    walletMap.set(w._id, existing);
  }
  
  // Convert to array and calculate metrics
  const drivers = Array.from(walletMap.entries())
    .map(([wallet, stats]) => {
      const netFlow = stats.in - stats.out;
      const totalActivity = stats.in + stats.out;
      const influence = totalVolume > 0 ? (totalActivity / totalVolume) * 100 : 0;
      
      let role: 'accumulator' | 'distributor' | 'mixed' = 'mixed';
      if (stats.in > stats.out * 2) role = 'accumulator';
      else if (stats.out > stats.in * 2) role = 'distributor';
      
      return {
        wallet,
        role,
        volumeIn: stats.in,
        volumeOut: stats.out,
        netFlow,
        influence,
      };
    })
    .sort((a, b) => (b.volumeIn + b.volumeOut) - (a.volumeIn + a.volumeOut))
    .slice(0, limit);
  
  // Check if there's concentration (top 3 > 50%)
  const top3Influence = drivers.slice(0, 3).reduce((sum, d) => sum + d.influence, 0);
  const hasConcentration = top3Influence > 50;
  
  return {
    topDrivers: drivers,
    totalVolume,
    hasConcentration,
  };
}
