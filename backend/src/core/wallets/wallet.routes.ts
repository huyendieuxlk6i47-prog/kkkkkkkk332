/**
 * Wallet Routes (B1)
 * 
 * API endpoints for wallet profiles
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { walletProfileEngine, RawWalletData } from './wallet_profile.engine';
import type { WalletTag } from './wallet_profile.schema';

interface WalletParams {
  address: string;
}

interface SearchQuery {
  tags?: string;
  limit?: string;
}

interface BuildProfileBody {
  address: string;
  chain?: string;
  transactions: RawWalletData['transactions'];
  isContract?: boolean;
  labels?: string[];
}

export async function walletRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/wallets/:address
   * Get wallet profile by address
   */
  fastify.get<{ Params: WalletParams; Querystring: { chain?: string } }>(
    '/wallets/:address',
    async (request, reply) => {
      const { address } = request.params;
      const chain = request.query.chain || 'Ethereum';
      
      try {
        const profile = await walletProfileEngine.getProfileByAddress(
          address.toLowerCase(),
          chain
        );
        
        if (!profile) {
          return reply.status(404).send({
            error: 'Profile not found',
            message: `No profile found for address ${address} on ${chain}`,
          });
        }
        
        // Return clean JSON (exclude MongoDB _id)
        const { ...cleanProfile } = profile as any;
        delete cleanProfile._id;
        delete cleanProfile.__v;
        
        return reply.send(cleanProfile);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to get wallet profile',
        });
      }
    }
  );

  /**
   * POST /api/wallets/profile
   * Build or refresh wallet profile
   */
  fastify.post<{ Body: BuildProfileBody }>(
    '/wallets/profile',
    async (request, reply) => {
      const { address, chain, transactions, isContract, labels } = request.body;
      
      if (!address) {
        return reply.status(400).send({
          error: 'Address is required',
        });
      }
      
      if (!transactions || transactions.length === 0) {
        return reply.status(400).send({
          error: 'Transactions array is required and cannot be empty',
        });
      }
      
      try {
        const rawData: RawWalletData = {
          address: address.toLowerCase(),
          chain: chain || 'Ethereum',
          transactions: transactions.map(tx => ({
            ...tx,
            timestamp: new Date(tx.timestamp),
          })),
          isContract,
          labels,
        };
        
        const profile = await walletProfileEngine.buildProfile(rawData);
        
        // Return clean JSON
        const { ...cleanProfile } = profile as any;
        delete cleanProfile._id;
        delete cleanProfile.__v;
        
        return reply.status(201).send(cleanProfile);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to build wallet profile',
        });
      }
    }
  );

  /**
   * GET /api/wallets/search
   * Search wallets by tags
   */
  fastify.get<{ Querystring: SearchQuery }>(
    '/wallets/search',
    async (request, reply) => {
      const { tags, limit } = request.query;
      
      try {
        let profiles;
        
        if (tags) {
          const tagList = tags.split(',').map(t => t.trim()) as WalletTag[];
          profiles = await walletProfileEngine.searchByTags(
            tagList,
            parseInt(limit || '50')
          );
        } else {
          // Return high-volume wallets by default
          profiles = await walletProfileEngine.getHighVolumeWallets(
            parseInt(limit || '20')
          );
        }
        
        // Clean MongoDB fields
        const cleanProfiles = profiles.map(p => {
          const { ...clean } = p as any;
          delete clean._id;
          delete clean.__v;
          return clean;
        });
        
        return reply.send({
          count: cleanProfiles.length,
          profiles: cleanProfiles,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to search wallets',
        });
      }
    }
  );

  /**
   * GET /api/wallets/high-volume
   * Get high-volume wallets
   */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/wallets/high-volume',
    async (request, reply) => {
      const limit = parseInt(request.query.limit || '20');
      
      try {
        const profiles = await walletProfileEngine.getHighVolumeWallets(limit);
        
        const cleanProfiles = profiles.map(p => {
          const { ...clean } = p as any;
          delete clean._id;
          delete clean.__v;
          return clean;
        });
        
        return reply.send({
          count: cleanProfiles.length,
          profiles: cleanProfiles,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to get high-volume wallets',
        });
      }
    }
  );

  /**
   * GET /api/wallets/tags
   * Get available wallet tags
   */
  fastify.get('/wallets/tags', async (request, reply) => {
    const tags = {
      activity: ['active', 'dormant', 'new'],
      volume: ['high-volume', 'low-volume', 'whale'],
      behavior: ['trader', 'holder', 'flipper', 'degen'],
      technical: ['bridge-user', 'cex-like', 'contract', 'multisig'],
    };
    
    return reply.send(tags);
  });
}
