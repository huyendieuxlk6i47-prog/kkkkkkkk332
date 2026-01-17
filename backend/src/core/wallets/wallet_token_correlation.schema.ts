/**
 * Wallet Token Correlation Schema (B2)
 * 
 * Purpose: "Этот токен движется из-за кого?"
 * 
 * B2 connects:
 * - Alerts (A) — explains cause
 * - Tokens — who drives activity  
 * - Wallets — their influence
 * 
 * WITHOUT this:
 * - Alerts look like "magic"
 * - Token Page is just a showcase
 * - Wallet Profile lives separately
 */
import { z } from 'zod';

/**
 * Wallet role in token activity
 */
export const WalletRoleEnum = z.enum([
  'buyer',     // Primarily buying/accumulating
  'seller',    // Primarily selling/distributing  
  'mixed',     // Both buying and selling
]);

/**
 * Timing relation to signal
 */
export const TimeRelationEnum = z.enum([
  'before_signal',   // Activity started before signal
  'during_signal',   // Activity during signal period
  'after_signal',    // Activity after signal
]);

/**
 * Main Wallet Token Correlation Schema
 */
export const WalletTokenCorrelationSchema = z.object({
  // Identity
  correlationId: z.string(),
  walletAddress: z.string(),
  tokenAddress: z.string(),
  chain: z.string().default('Ethereum'),
  
  // Role classification
  role: WalletRoleEnum,
  
  // Influence score (0-1)
  // Higher = more influential on token activity
  influenceScore: z.number().min(0).max(1),
  
  // Flow metrics
  netFlow: z.number(),         // Positive = accumulation, Negative = distribution
  totalVolume: z.number(),     // Absolute volume in USD
  txCount: z.number(),         // Number of transactions
  
  // Volume share (percentage of total token flow)
  volumeShare: z.number().min(0).max(1),
  
  // Activity frequency
  activityFrequency: z.number(), // Transactions per day
  
  // Timing analysis
  timeRelation: TimeRelationEnum,
  timingWeight: z.number().min(0).max(1), // Higher = earlier/better timing
  
  // Time window
  periodStart: z.date(),
  periodEnd: z.date(),
  
  // Confidence (based on data quality)
  confidence: z.number().min(0).max(1),
  
  // Wallet metadata (from B1 profile)
  walletMeta: z.object({
    tags: z.array(z.string()).optional(),
    headline: z.string().optional(),
  }).optional(),
  
  // Token metadata
  tokenMeta: z.object({
    symbol: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  
  // Timestamps
  calculatedAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Token Activity Drivers - aggregated view for UI
 */
export const TokenActivityDriversSchema = z.object({
  tokenAddress: z.string(),
  chain: z.string(),
  
  // Summary
  totalParticipants: z.number(),
  dominantRole: WalletRoleEnum,
  
  // Top drivers (sorted by influenceScore)
  topDrivers: z.array(z.object({
    walletAddress: z.string(),
    role: WalletRoleEnum,
    influenceScore: z.number(),
    volumeShare: z.number(),
    netFlow: z.number(),
    txCount: z.number(),
    confidence: z.number(),
    walletMeta: z.object({
      tags: z.array(z.string()).optional(),
      headline: z.string().optional(),
    }).optional(),
  })),
  
  // Human-readable summary
  summary: z.object({
    headline: z.string(),      // "2 high-activity wallets driving accumulation"
    description: z.string(),   // Detailed explanation
  }),
  
  // Period
  periodStart: z.date(),
  periodEnd: z.date(),
  calculatedAt: z.date(),
});

/**
 * Alert Group Drivers - for linking B2 to alerts (A)
 */
export const AlertGroupDriversSchema = z.object({
  groupId: z.string(),
  
  // Wallet drivers
  drivers: z.array(z.object({
    walletAddress: z.string(),
    influenceScore: z.number(),
    role: WalletRoleEnum,
    confidence: z.number(),
  })),
  
  // Summary for alert card
  driverSummary: z.string(),   // "Driven by Wallet A and 1 more"
  
  calculatedAt: z.date(),
});

// Type exports
export type WalletRole = z.infer<typeof WalletRoleEnum>;
export type TimeRelation = z.infer<typeof TimeRelationEnum>;
export type WalletTokenCorrelation = z.infer<typeof WalletTokenCorrelationSchema>;
export type TokenActivityDrivers = z.infer<typeof TokenActivityDriversSchema>;
export type AlertGroupDrivers = z.infer<typeof AlertGroupDriversSchema>;
