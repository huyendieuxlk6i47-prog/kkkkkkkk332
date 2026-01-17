/**
 * Routes - PLACEHOLDER
 */
import type { FastifyInstance } from 'fastify';

export async function routes(app: FastifyInstance): Promise<void> {
  app.get('/', async () => ({ ok: true, message: 'Module not implemented yet' }));
}
