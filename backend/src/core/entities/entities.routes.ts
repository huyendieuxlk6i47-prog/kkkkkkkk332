/**
 * Entity Routes (Phase 15.5.2 - Step 2)
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import * as entityProfileService from './entity_profile.service.js';

export async function entitiesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/entities/:id/profile
   * Get comprehensive entity profile
   */
  app.get('/:id/profile', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const profile = await entityProfileService.getEntityProfile(id);
    
    if (!profile) {
      return {
        ok: false,
        error: 'ENTITY_NOT_FOUND',
        message: 'No entity found with this ID or name',
      };
    }
    
    return {
      ok: true,
      data: profile,
    };
  });
  
  /**
   * GET /api/entities/:id/actors
   * Get actors belonging to entity
   */
  app.get('/:id/actors', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const actors = await entityProfileService.getEntityActors(id);
    
    return {
      ok: true,
      data: actors,
      count: actors.length,
    };
  });
  
  /**
   * GET /api/entities/:id/strategies
   * Get strategies used by entity
   */
  app.get('/:id/strategies', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const strategies = await entityProfileService.getEntityStrategies(id);
    
    return {
      ok: true,
      data: strategies,
      count: strategies.length,
    };
  });
  
  app.log.info('Entity Profile routes registered');
}
