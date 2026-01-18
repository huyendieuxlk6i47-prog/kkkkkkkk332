/**
 * Market Routes (Phase 14A)
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import * as priceService from './price.service.js';
import * as metricsService from './market_metrics.service.js';
import { KNOWN_TOKENS } from './dex_pairs.model.js';
import { parsePrice } from './price_points.model.js';
import { MetricsWindow } from './market_metrics.model.js';

export async function marketRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/prices/:asset/latest
   * Get latest price for an asset
   */
  app.get('/prices/:asset/latest', async (request: FastifyRequest) => {
    const { asset } = request.params as { asset: string };
    const query = request.query as { chain?: string };
    
    const price = await priceService.getLatestPrice(asset, query.chain || 'ethereum');
    
    if (!price) {
      return { ok: false, error: 'Price not found' };
    }
    
    return {
      ok: true,
      data: {
        assetAddress: price.assetAddress,
        priceUsd: parsePrice(price.priceUsd),
        priceEth: parsePrice(price.priceEth),
        confidence: price.confidence,
        source: price.source,
        timestamp: price.timestamp,
      },
    };
  });
  
  /**
   * GET /api/prices/:asset
   * Get price history for an asset
   */
  app.get('/prices/:asset', async (request: FastifyRequest) => {
    const { asset } = request.params as { asset: string };
    const query = request.query as { chain?: string; from?: string; to?: string; bucket?: string };
    
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    const bucket = (query.bucket || '1m') as '1m' | '5m' | '1h';
    
    const prices = await priceService.getPriceHistory(asset, query.chain || 'ethereum', from, to, bucket);
    
    return {
      ok: true,
      data: prices.map(p => ({
        timestamp: p.timestamp,
        priceUsd: parsePrice(p.priceUsd),
        priceEth: parsePrice(p.priceEth),
        confidence: p.confidence,
      })),
      count: prices.length,
    };
  });
  
  /**
   * GET /api/prices/weth/usd
   * Get current WETH price in USD
   */
  app.get('/prices/weth/usd', async () => {
    const price = await priceService.getWethPriceUsd();
    
    return {
      ok: true,
      data: {
        symbol: 'WETH',
        priceUsd: price || 0,
        available: price !== null,
      },
    };
  });
  
  /**
   * GET /api/market-metrics/:asset
   * Get market metrics for an asset
   */
  app.get('/market-metrics/:asset', async (request: FastifyRequest) => {
    const { asset } = request.params as { asset: string };
    const query = request.query as { chain?: string; window?: string };
    
    const window = (query.window || '24h') as MetricsWindow;
    if (!['1h', '4h', '24h', '7d'].includes(window)) {
      return { ok: false, error: 'Invalid window. Use: 1h, 4h, 24h, 7d' };
    }
    
    const metrics = await metricsService.getMarketMetrics(asset, query.chain || 'ethereum', window);
    
    if (!metrics) {
      return { ok: false, error: 'Metrics not available - insufficient price data' };
    }
    
    return {
      ok: true,
      data: {
        assetAddress: metrics.assetAddress,
        window: metrics.window,
        priceChange: metrics.priceChange,
        volatility: metrics.volatility,
        trend: metrics.trend,
        trendStrength: metrics.trendStrength,
        maxDrawdown: metrics.maxDrawdown,
        liquidityScore: metrics.liquidityScore,
        priceConfidenceAvg: metrics.priceConfidenceAvg,
        dataPointsCount: metrics.dataPointsCount,
        calculatedAt: metrics.calculatedAt,
        validUntil: metrics.validUntil,
      },
    };
  });
  
  /**
   * GET /api/market-metrics/top
   * Get top assets by metric
   */
  app.get('/market-metrics/top', async (request: FastifyRequest) => {
    const query = request.query as { window?: string; by?: string; limit?: string; chain?: string };
    
    const window = (query.window || '24h') as MetricsWindow;
    const sortBy = (query.by || 'volatility') as 'volatility' | 'trend' | 'liquidity' | 'priceChange';
    const limit = Math.min(50, parseInt(query.limit || '20'));
    
    const top = await metricsService.getTopAssets(window, sortBy, limit, query.chain || 'ethereum');
    
    return {
      ok: true,
      data: top.map(m => ({
        assetAddress: m.assetAddress,
        priceChange: m.priceChange,
        volatility: m.volatility,
        trend: m.trend,
        liquidityScore: m.liquidityScore,
      })),
      count: top.length,
    };
  });
  
  /**
   * GET /api/market/known-tokens
   * Get list of known tokens
   */
  app.get('/known-tokens', async (request: FastifyRequest) => {
    const query = request.query as { chain?: string };
    const chain = query.chain || 'ethereum';
    
    const tokens = KNOWN_TOKENS[chain] || {};
    
    return {
      ok: true,
      data: Object.entries(tokens).map(([symbol, info]) => ({
        symbol,
        address: info.address,
        decimals: info.decimals,
      })),
    };
  });
  
  /**
   * GET /api/market/context/:asset
   * Get comprehensive market context for exploration mode
   */
  app.get('/context/:asset', async (request: FastifyRequest) => {
    const { asset } = request.params as { asset: string };
    const query = request.query as { chain?: string };
    
    const { getMarketContext } = await import('./market_context.service.js');
    const context = await getMarketContext(asset, query.chain || 'ethereum');
    
    return {
      ok: true,
      data: context,
    };
  });
  
  /**
   * GET /api/market/token-activity/:tokenAddress
   * Get real-time activity snapshot for a token from indexed transfers
   * 
   * This is the CRITICAL endpoint for TokensPage Activity Snapshot
   */
  app.get('/token-activity/:tokenAddress', async (request: FastifyRequest) => {
    const { tokenAddress } = request.params as { tokenAddress: string };
    const query = request.query as { window?: string };
    
    const windowHours = query.window === '1h' ? 1 : query.window === '6h' ? 6 : 24;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    
    const { TransferModel } = await import('../transfers/transfers.model.js');
    const { ERC20LogModel } = await import('../../onchain/ethereum/logs_erc20.model.js');
    
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Aggregate from logs_erc20 (raw indexed data)
    // Use blockTimestamp field for filtering
    const [transferStats, walletStats, largestTransfer] = await Promise.all([
      // Count and sum transfers
      ERC20LogModel.aggregate([
        { $match: { 
          token: normalizedAddress,
          blockTimestamp: { $gte: since }
        }},
        { $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$amount' } },
          avgAmount: { $avg: { $toDouble: '$amount' } },
        }},
      ]),
      
      // Count unique wallets (senders + receivers)
      ERC20LogModel.aggregate([
        { $match: { 
          token: normalizedAddress,
          blockTimestamp: { $gte: since }
        }},
        { $group: { _id: null, 
          senders: { $addToSet: '$from' },
          receivers: { $addToSet: '$to' }
        }},
        { $project: {
          uniqueWallets: { $setUnion: ['$senders', '$receivers'] }
        }},
        { $project: {
          count: { $size: '$uniqueWallets' }
        }}
      ]),
      
      // Find largest transfer
      ERC20LogModel.findOne({ 
        token: normalizedAddress,
        blockTimestamp: { $gte: since }
      }).sort({ amount: -1 }).limit(1),
    ]);
    
    const stats = transferStats[0] || { count: 0, totalAmount: 0, avgAmount: 0 };
    const uniqueWallets = walletStats[0]?.count || 0;
    const largestAmount = largestTransfer?.amount || null;
    
    // Calculate inflow/outflow from normalized transfers (if available)
    let inflow = 0;
    let outflow = 0;
    let netFlow = 0;
    
    const flowStats = await TransferModel.aggregate([
      { $match: { 
        assetAddress: normalizedAddress,
        timestamp: { $gte: since }
      }},
      { $group: {
        _id: null,
        totalInflow: { $sum: { $cond: [{ $gt: ['$valueUsd', 0] }, '$valueUsd', 0] } },
        totalOutflow: { $sum: { $cond: [{ $lt: ['$valueUsd', 0] }, { $abs: '$valueUsd' }, 0] } },
      }},
    ]);
    
    if (flowStats[0]) {
      inflow = flowStats[0].totalInflow || 0;
      outflow = flowStats[0].totalOutflow || 0;
      netFlow = inflow - outflow;
    }
    
    return {
      ok: true,
      data: {
        tokenAddress: normalizedAddress,
        window: `${windowHours}h`,
        activity: {
          transfers24h: stats.count,
          activeWallets: uniqueWallets,
          largestTransfer: largestAmount ? parseFloat(largestAmount) : null,
        },
        flows: {
          inflow,
          outflow,
          netFlow,
        },
        analyzedAt: new Date().toISOString(),
        dataSource: 'indexed_transfers',
      },
    };
  });
  
  /**
   * GET /api/market/flow-anomalies
   * Get flow anomalies (z-score deviations) for an asset
   */
  app.get('/flow-anomalies', async (request: FastifyRequest) => {
    const query = request.query as { 
      asset?: string; 
      chain?: string; 
      timeframe?: '7d' | '14d' | '30d';
    };
    
    const asset = query.asset || '0x0000000000000000000000000000000000000000'; // ETH default
    const chain = query.chain || 'ethereum';
    const timeframe = query.timeframe || '7d';
    
    const { getFlowAnomalies } = await import('./flow_anomalies.service.js');
    const anomalies = await getFlowAnomalies(asset, chain, timeframe);
    
    return {
      ok: true,
      data: anomalies,
    };
  });
  
  app.log.info('Market routes registered');
}
