/**
 * Wallet Token Correlation Engine (B2)
 * 
 * Purpose: "Этот токен движется из-за кого?"
 * 
 * Calculates influence score using:
 * - Volume share (доля кошелька в общем потоке)
 * - Activity frequency (как часто участвовал)
 * - Timing weight (до/во время сигнала)
 * 
 * Formula (MVP):
 * influenceScore = w1 * volume_share + w2 * activity_freq + w3 * timing_weight
 */
import { v4 as uuidv4 } from 'uuid';
import type { 
  WalletTokenCorrelation, 
  TokenActivityDrivers,
  WalletRole,
  TimeRelation,
  AlertGroupDrivers,
} from './wallet_token_correlation.schema';
import { WalletTokenCorrelationModel, AlertGroupDriversModel } from './wallet_token_correlation.model';
import { WalletProfileModel } from './wallet_profile.model';
import { SignalModel } from '../signals/signals.model';
import { TransferModel } from '../transfers/transfers.model';
import { AlertGroupModel } from '../alerts/grouping/alert_group.model';

/**
 * Weights for influence score calculation
 */
const INFLUENCE_WEIGHTS = {
  volumeShare: 0.4,      // 40% - доля в объеме
  activityFrequency: 0.3, // 30% - частота активности  
  timingWeight: 0.3,      // 30% - время относительно сигнала
};

/**
 * Thresholds
 */
const THRESHOLDS = {
  minTxCount: 2,           // Minimum transactions to be considered
  minVolumeShare: 0.01,    // Minimum 1% volume share
  topDriversLimit: 10,     // Max drivers to return
  analysisWindowHours: 24, // Default analysis window
};

export class WalletTokenCorrelationEngine {
  /**
   * Calculate correlations for a token
   */
  async calculateTokenCorrelations(
    tokenAddress: string,
    chain: string = 'Ethereum',
    windowHours: number = THRESHOLDS.analysisWindowHours
  ): Promise<WalletTokenCorrelation[]> {
    const tokenAddr = tokenAddress.toLowerCase();
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - windowHours * 60 * 60 * 1000);
    
    // Get transfers for this token in the window
    const transfers = await TransferModel.find({
      tokenAddress: tokenAddr,
      timestamp: { $gte: periodStart, $lte: periodEnd },
    }).lean();
    
    if (transfers.length === 0) {
      return [];
    }
    
    // Aggregate by wallet
    const walletStats = new Map<string, {
      inVolume: number;
      outVolume: number;
      txCount: number;
      firstTx: Date;
      lastTx: Date;
    }>();
    
    let totalVolume = 0;
    
    for (const tx of transfers) {
      const from = (tx.fromAddress || '').toLowerCase();
      const to = (tx.toAddress || '').toLowerCase();
      const value = tx.valueUsd || 0;
      
      totalVolume += value;
      
      // From wallet (outflow)
      if (from && from !== '0x0000000000000000000000000000000000000000') {
        const stats = walletStats.get(from) || {
          inVolume: 0, outVolume: 0, txCount: 0,
          firstTx: tx.timestamp, lastTx: tx.timestamp,
        };
        stats.outVolume += value;
        stats.txCount++;
        if (tx.timestamp < stats.firstTx) stats.firstTx = tx.timestamp;
        if (tx.timestamp > stats.lastTx) stats.lastTx = tx.timestamp;
        walletStats.set(from, stats);
      }
      
      // To wallet (inflow)
      if (to && to !== '0x0000000000000000000000000000000000000000') {
        const stats = walletStats.get(to) || {
          inVolume: 0, outVolume: 0, txCount: 0,
          firstTx: tx.timestamp, lastTx: tx.timestamp,
        };
        stats.inVolume += value;
        stats.txCount++;
        if (tx.timestamp < stats.firstTx) stats.firstTx = tx.timestamp;
        if (tx.timestamp > stats.lastTx) stats.lastTx = tx.timestamp;
        walletStats.set(to, stats);
      }
    }
    
    // Get signals for timing analysis
    const signals = await SignalModel.find({
      assetAddress: tokenAddr,
      timestamp: { $gte: periodStart, $lte: periodEnd },
    }).sort({ timestamp: 1 }).lean();
    
    const firstSignalTime = signals.length > 0 ? signals[0].timestamp : periodEnd;
    
    // Calculate correlations
    const correlations: WalletTokenCorrelation[] = [];
    
    for (const [walletAddress, stats] of walletStats) {
      // Filter by minimum thresholds
      const walletVolume = stats.inVolume + stats.outVolume;
      const volumeShare = totalVolume > 0 ? walletVolume / totalVolume : 0;
      
      if (stats.txCount < THRESHOLDS.minTxCount) continue;
      if (volumeShare < THRESHOLDS.minVolumeShare) continue;
      
      // Determine role
      const netFlow = stats.inVolume - stats.outVolume;
      let role: WalletRole = 'mixed';
      if (netFlow > walletVolume * 0.3) role = 'buyer';
      else if (netFlow < -walletVolume * 0.3) role = 'seller';
      
      // Calculate timing weight
      const { timeRelation, timingWeight } = this.calculateTimingMetrics(
        stats.firstTx,
        firstSignalTime,
        periodStart
      );
      
      // Calculate activity frequency (tx per day)
      const daySpan = Math.max(1, 
        (stats.lastTx.getTime() - stats.firstTx.getTime()) / (1000 * 60 * 60 * 24)
      );
      const activityFrequency = stats.txCount / daySpan;
      const normalizedFrequency = Math.min(1, activityFrequency / 10); // Cap at 10 tx/day
      
      // Calculate influence score
      const influenceScore = 
        INFLUENCE_WEIGHTS.volumeShare * volumeShare +
        INFLUENCE_WEIGHTS.activityFrequency * normalizedFrequency +
        INFLUENCE_WEIGHTS.timingWeight * timingWeight;
      
      // Get wallet profile for metadata
      const walletProfile = await WalletProfileModel.findOne({ 
        address: walletAddress 
      }).lean();
      
      const correlation: WalletTokenCorrelation = {
        correlationId: uuidv4(),
        walletAddress,
        tokenAddress: tokenAddr,
        chain,
        role,
        influenceScore: Math.min(1, influenceScore),
        netFlow,
        totalVolume: walletVolume,
        txCount: stats.txCount,
        volumeShare,
        activityFrequency,
        timeRelation,
        timingWeight,
        periodStart,
        periodEnd,
        confidence: this.calculateConfidence(stats.txCount, volumeShare),
        walletMeta: walletProfile ? {
          tags: walletProfile.tags || [],
          headline: walletProfile.summary?.headline,
        } : undefined,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      };
      
      correlations.push(correlation);
    }
    
    // Sort by influence score
    correlations.sort((a, b) => b.influenceScore - a.influenceScore);
    
    // Save top correlations to database
    const topCorrelations = correlations.slice(0, THRESHOLDS.topDriversLimit);
    for (const correlation of topCorrelations) {
      await WalletTokenCorrelationModel.findOneAndUpdate(
        { walletAddress: correlation.walletAddress, tokenAddress: correlation.tokenAddress },
        { $set: correlation },
        { upsert: true }
      );
    }
    
    return topCorrelations;
  }
  
  /**
   * Calculate timing metrics relative to signal
   */
  private calculateTimingMetrics(
    firstActivityTime: Date,
    firstSignalTime: Date,
    periodStart: Date
  ): { timeRelation: TimeRelation; timingWeight: number } {
    const activityMs = firstActivityTime.getTime();
    const signalMs = firstSignalTime.getTime();
    const periodMs = periodStart.getTime();
    
    let timeRelation: TimeRelation;
    let timingWeight: number;
    
    if (activityMs < signalMs - 60 * 60 * 1000) {
      // More than 1 hour before signal
      timeRelation = 'before_signal';
      timingWeight = 1.0; // Best timing
    } else if (activityMs <= signalMs + 60 * 60 * 1000) {
      // Within 1 hour of signal
      timeRelation = 'during_signal';
      timingWeight = 0.7;
    } else {
      // After signal
      timeRelation = 'after_signal';
      timingWeight = 0.3;
    }
    
    return { timeRelation, timingWeight };
  }
  
  /**
   * Calculate confidence based on data quality
   */
  private calculateConfidence(txCount: number, volumeShare: number): number {
    let confidence = 0.3; // Base
    
    // More transactions = higher confidence
    if (txCount >= 20) confidence += 0.3;
    else if (txCount >= 10) confidence += 0.2;
    else if (txCount >= 5) confidence += 0.1;
    
    // Higher volume share = higher confidence
    if (volumeShare >= 0.1) confidence += 0.3;
    else if (volumeShare >= 0.05) confidence += 0.2;
    else if (volumeShare >= 0.02) confidence += 0.1;
    
    return Math.min(1, confidence);
  }
  
  /**
   * Get token activity drivers (aggregated view for UI)
   */
  async getTokenActivityDrivers(
    tokenAddress: string,
    chain: string = 'Ethereum',
    limit: number = 5
  ): Promise<TokenActivityDrivers | null> {
    const tokenAddr = tokenAddress.toLowerCase();
    
    // First try to get from recent calculations
    const correlations = await WalletTokenCorrelationModel.find({
      tokenAddress: tokenAddr,
      chain,
    })
      .sort({ influenceScore: -1 })
      .limit(limit)
      .lean();
    
    // If no data, calculate fresh
    if (correlations.length === 0) {
      const freshCorrelations = await this.calculateTokenCorrelations(tokenAddr, chain);
      if (freshCorrelations.length === 0) {
        return null;
      }
      return this.buildActivityDrivers(tokenAddr, chain, freshCorrelations.slice(0, limit));
    }
    
    return this.buildActivityDrivers(tokenAddr, chain, correlations as WalletTokenCorrelation[]);
  }
  
  /**
   * Build activity drivers response
   */
  private buildActivityDrivers(
    tokenAddress: string,
    chain: string,
    correlations: WalletTokenCorrelation[]
  ): TokenActivityDrivers {
    // Calculate dominant role
    const roleCounts = { buyer: 0, seller: 0, mixed: 0 };
    for (const c of correlations) {
      roleCounts[c.role]++;
    }
    const dominantRole = roleCounts.buyer >= roleCounts.seller ? 'buyer' : 'seller';
    
    // Generate summary
    const highInfluence = correlations.filter(c => c.influenceScore > 0.5);
    const headline = this.generateHeadline(highInfluence.length, dominantRole);
    const description = this.generateDescription(correlations);
    
    return {
      tokenAddress,
      chain,
      totalParticipants: correlations.length,
      dominantRole,
      topDrivers: correlations.map(c => ({
        walletAddress: c.walletAddress,
        role: c.role,
        influenceScore: c.influenceScore,
        volumeShare: c.volumeShare,
        netFlow: c.netFlow,
        txCount: c.txCount,
        confidence: c.confidence,
        walletMeta: c.walletMeta,
      })),
      summary: {
        headline,
        description,
      },
      periodStart: correlations[0]?.periodStart || new Date(),
      periodEnd: correlations[0]?.periodEnd || new Date(),
      calculatedAt: new Date(),
    };
  }
  
  /**
   * Generate headline for UI
   */
  private generateHeadline(highInfluenceCount: number, dominantRole: WalletRole): string {
    const roleText = dominantRole === 'buyer' ? 'accumulation' : 'distribution';
    
    if (highInfluenceCount === 0) {
      return 'No significant wallet activity detected';
    } else if (highInfluenceCount === 1) {
      return `1 high-activity wallet driving ${roleText}`;
    } else {
      return `${highInfluenceCount} high-activity wallets driving ${roleText}`;
    }
  }
  
  /**
   * Generate description for UI
   */
  private generateDescription(correlations: WalletTokenCorrelation[]): string {
    if (correlations.length === 0) {
      return 'Insufficient data to analyze wallet influence.';
    }
    
    const top = correlations[0];
    const totalShare = correlations.reduce((sum, c) => sum + c.volumeShare, 0);
    
    const parts: string[] = [];
    
    // Volume concentration
    if (totalShare > 0.5) {
      parts.push(`Top ${correlations.length} wallets account for ${Math.round(totalShare * 100)}% of recent volume`);
    }
    
    // Timing insight
    const earlyWallets = correlations.filter(c => c.timeRelation === 'before_signal');
    if (earlyWallets.length > 0) {
      parts.push(`${earlyWallets.length} wallet(s) were active before signal detection`);
    }
    
    // Role breakdown
    const buyers = correlations.filter(c => c.role === 'buyer');
    const sellers = correlations.filter(c => c.role === 'seller');
    if (buyers.length > sellers.length * 2) {
      parts.push('Predominantly buying activity');
    } else if (sellers.length > buyers.length * 2) {
      parts.push('Predominantly selling activity');
    }
    
    return parts.join('. ') + (parts.length > 0 ? '.' : 'Activity analysis in progress.');
  }
  
  /**
   * Link drivers to alert group
   */
  async linkDriversToAlertGroup(
    groupId: string,
    tokenAddress: string,
    chain: string = 'Ethereum'
  ): Promise<AlertGroupDrivers | null> {
    const drivers = await this.getTokenActivityDrivers(tokenAddress, chain);
    
    if (!drivers || drivers.topDrivers.length === 0) {
      return null;
    }
    
    // Create driver summary for alert card
    const topDriver = drivers.topDrivers[0];
    const additionalCount = drivers.topDrivers.length - 1;
    
    let driverSummary: string;
    const displayAddr = `${topDriver.walletAddress.slice(0, 6)}...${topDriver.walletAddress.slice(-4)}`;
    
    if (additionalCount === 0) {
      driverSummary = `Driven by ${displayAddr}`;
    } else {
      driverSummary = `Driven by ${displayAddr} and ${additionalCount} more`;
    }
    
    const alertGroupDrivers: AlertGroupDrivers = {
      groupId,
      drivers: drivers.topDrivers.slice(0, 5).map(d => ({
        walletAddress: d.walletAddress,
        influenceScore: d.influenceScore,
        role: d.role,
        confidence: d.confidence,
      })),
      driverSummary,
      calculatedAt: new Date(),
    };
    
    // Save to database
    await AlertGroupDriversModel.findOneAndUpdate(
      { groupId },
      { $set: alertGroupDrivers },
      { upsert: true }
    );
    
    return alertGroupDrivers;
  }
  
  /**
   * Get drivers for alert group
   */
  async getAlertGroupDrivers(groupId: string): Promise<AlertGroupDrivers | null> {
    const drivers = await AlertGroupDriversModel.findOne({ groupId }).lean();
    return drivers as AlertGroupDrivers | null;
  }
  
  /**
   * Get wallet's token correlations
   */
  async getWalletCorrelations(
    walletAddress: string,
    limit: number = 10
  ): Promise<WalletTokenCorrelation[]> {
    const addr = walletAddress.toLowerCase();
    
    return WalletTokenCorrelationModel.find({ walletAddress: addr })
      .sort({ influenceScore: -1 })
      .limit(limit)
      .lean() as Promise<WalletTokenCorrelation[]>;
  }
}

// Export singleton
export const walletTokenCorrelationEngine = new WalletTokenCorrelationEngine();
