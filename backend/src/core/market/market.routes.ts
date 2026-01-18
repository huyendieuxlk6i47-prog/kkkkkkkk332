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
    
    const { ERC20LogModel } = await import('../../onchain/ethereum/logs_erc20.model.js');
    
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Token price mapping (stablecoins = $1, others we have in mapping)
    const TOKEN_PRICES: Record<string, number> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 1, // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1, // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f': 1, // DAI
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 3500, // WETH
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 100000, // WBTC
    };
    
    // Token decimals
    const TOKEN_DECIMALS: Record<string, number> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 6, // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6, // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f': 18, // DAI
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 18, // WETH
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8, // WBTC
    };
    
    const price = TOKEN_PRICES[normalizedAddress] ?? null;
    const decimals = TOKEN_DECIMALS[normalizedAddress] ?? 18;
    
    // Aggregate from logs_erc20 (raw indexed data)
    const [transferStats, walletStats, largestTransfer, flowStats] = await Promise.all([
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
      
      // Calculate net flow by aggregating per wallet
      // Positive = received, Negative = sent
      ERC20LogModel.aggregate([
        { $match: { 
          token: normalizedAddress,
          blockTimestamp: { $gte: since }
        }},
        { $facet: {
          incoming: [
            { $group: { _id: '$to', amount: { $sum: { $toDouble: '$amount' } } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ],
          outgoing: [
            { $group: { _id: '$from', amount: { $sum: { $toDouble: '$amount' } } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]
        }}
      ]),
    ]);
    
    const stats = transferStats[0] || { count: 0, totalAmount: 0 };
    const uniqueWallets = walletStats[0]?.count || 0;
    const largestAmount = largestTransfer?.amount || null;
    
    // Calculate USD values if we have price
    let inflow = 0;
    let outflow = 0;
    let netFlow = 0;
    let largestTransferUsd = null;
    
    if (price !== null && flowStats[0]) {
      const incoming = flowStats[0].incoming?.[0]?.total || 0;
      const outgoing = flowStats[0].outgoing?.[0]?.total || 0;
      
      // Convert to USD (divide by decimals, multiply by price)
      inflow = (incoming / Math.pow(10, decimals)) * price;
      outflow = (outgoing / Math.pow(10, decimals)) * price;
      
      // Net flow = sum of all transfers (in - out for entire network = 0)
      // For a single token, we show total volume as indication of flow
      netFlow = stats.totalAmount ? (stats.totalAmount / Math.pow(10, decimals)) * price : 0;
      
      if (largestAmount) {
        largestTransferUsd = (parseFloat(largestAmount) / Math.pow(10, decimals)) * price;
      }
    }
    
    return {
      ok: true,
      data: {
        tokenAddress: normalizedAddress,
        window: `${windowHours}h`,
        activity: {
          transfers24h: stats.count,
          activeWallets: uniqueWallets,
          largestTransfer: largestTransferUsd,
        },
        flows: {
          inflow,
          outflow,
          netFlow,
          hasPrice: price !== null,
        },
        analyzedAt: new Date().toISOString(),
        dataSource: 'indexed_transfers',
      },
    };
  });
  
  /**
   * GET /api/market/token-signals/:tokenAddress
   * Get generated signals for a token based on baseline deviation
   */
  app.get('/token-signals/:tokenAddress', async (request: FastifyRequest) => {
    const { tokenAddress } = request.params as { tokenAddress: string };
    
    const { generateTokenSignals } = await import('./token_signals.service.js');
    const signals = await generateTokenSignals(tokenAddress);
    
    return {
      ok: true,
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        signals,
        analyzedAt: new Date().toISOString(),
      },
    };
  });
  
  /**
   * GET /api/market/token-drivers/:tokenAddress
   * Get top wallets driving activity for a token (B2 block)
   */
  app.get('/token-drivers/:tokenAddress', async (request: FastifyRequest) => {
    const { tokenAddress } = request.params as { tokenAddress: string };
    const query = request.query as { limit?: string };
    const limit = Math.min(parseInt(query.limit || '10'), 50);
    
    const { getActivityDrivers } = await import('./token_signals.service.js');
    const drivers = await getActivityDrivers(tokenAddress, limit);
    
    // Token decimals for USD conversion
    const TOKEN_DECIMALS: Record<string, number> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 6, // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6, // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f': 18, // DAI
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 18, // WETH
    };
    
    const TOKEN_PRICES: Record<string, number> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 1, // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1, // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f': 1, // DAI
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 3500, // WETH
    };
    
    const normalized = tokenAddress.toLowerCase();
    const decimals = TOKEN_DECIMALS[normalized] ?? 18;
    const price = TOKEN_PRICES[normalized] ?? null;
    
    // Convert to USD if we have price
    const convertedDrivers = drivers.topDrivers.map(d => ({
      ...d,
      volumeInUsd: price ? (d.volumeIn / Math.pow(10, decimals)) * price : null,
      volumeOutUsd: price ? (d.volumeOut / Math.pow(10, decimals)) * price : null,
      netFlowUsd: price ? (d.netFlow / Math.pow(10, decimals)) * price : null,
    }));
    
    return {
      ok: true,
      data: {
        tokenAddress: normalized,
        topDrivers: convertedDrivers,
        totalVolume: drivers.totalVolume,
        totalVolumeUsd: price ? (drivers.totalVolume / Math.pow(10, decimals)) * price : null,
        hasConcentration: drivers.hasConcentration,
        window: '24h',
        analyzedAt: new Date().toISOString(),
      },
    };
  });
  
  /**
   * GET /api/market/top-active-tokens
   * Get top active tokens by transfer count (Market Discovery)
   */
  app.get('/top-active-tokens', async (request: FastifyRequest) => {
    const query = request.query as { limit?: string; window?: string };
    const limit = Math.min(parseInt(query.limit || '10'), 50);
    const windowHours = query.window === '1h' ? 1 : query.window === '6h' ? 6 : 24;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    
    const { ERC20LogModel } = await import('../../onchain/ethereum/logs_erc20.model.js');
    
    // Known token metadata
    const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
      '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
      '0x514910771af9ca656af840dff83e8264ecf986ca': { symbol: 'LINK', name: 'Chainlink', decimals: 18 },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': { symbol: 'UNI', name: 'Uniswap', decimals: 18 },
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': { symbol: 'AAVE', name: 'Aave', decimals: 18 },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    };
    
    // Aggregate top tokens
    const pipeline = [
      { $match: { blockTimestamp: { $gte: since } } },
      { $group: {
        _id: '$token',
        transferCount: { $sum: 1 },
        senders: { $addToSet: '$from' },
        receivers: { $addToSet: '$to' },
        latestBlock: { $max: '$blockNumber' },
      }},
      { $project: {
        token: '$_id',
        transferCount: 1,
        walletCount: { $size: { $setUnion: ['$senders', '$receivers'] } },
        latestBlock: 1,
      }},
      { $sort: { transferCount: -1 } },
      { $limit: limit },
    ];
    
    const results = await ERC20LogModel.aggregate(pipeline);
    
    // Enrich with metadata
    const enrichedTokens = results.map((r: any) => {
      const meta = KNOWN_TOKENS[r.token] || null;
      return {
        address: r.token,
        symbol: meta?.symbol || null,
        name: meta?.name || null,
        transferCount: r.transferCount,
        activeWallets: r.walletCount,
        isKnown: !!meta,
      };
    });
    
    return {
      ok: true,
      data: {
        tokens: enrichedTokens,
        window: `${windowHours}h`,
        analyzedAt: new Date().toISOString(),
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
