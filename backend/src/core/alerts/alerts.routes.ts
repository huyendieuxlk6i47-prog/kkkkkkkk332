/**
 * Alerts Routes
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as service from './alerts.service.js';
import * as rulesRepo from './alert_rules.repository.js';
import {
  CreateAlertRuleBody,
  UpdateAlertRuleBody,
  GetAlertRulesQuery,
  GetAlertFeedQuery,
  RuleIdParams,
  AlertIdParams,
} from './alerts.schema.js';

// Helper to get userId
function getUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'] as string;
  return userId || 'anonymous';
}

export async function alertsRoutes(app: FastifyInstance): Promise<void> {
  // ========== ALERT RULES ==========
  
  /**
   * POST /api/alerts/rules
   * Create new alert rule (auto-creates WatchlistItem)
   */
  app.post('/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const body = CreateAlertRuleBody.parse(request.body);
    
    const rule = await service.createAlertRule(
      userId,
      body.scope,
      body.targetId,
      body.triggerTypes,
      {
        trigger: body.trigger,
        channels: body.channels,
        minSeverity: body.minSeverity,
        minConfidence: body.minConfidence,
        minStability: body.minStability,
        throttle: body.throttle,
        name: body.name,
        targetMeta: body.targetMeta,
      }
    );
    
    return reply.status(201).send({ ok: true, data: rule });
  });
  
  /**
   * GET /api/alerts/rules
   * Get user's alert rules
   */
  app.get('/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const query = GetAlertRulesQuery.parse(request.query);
    
    const rules = await service.getUserAlertRules(userId, query.activeOnly);
    
    return { ok: true, data: rules, count: rules.length };
  });
  
  /**
   * PUT /api/alerts/rules/:id
   * Update alert rule
   */
  app.put('/rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const params = RuleIdParams.parse(request.params);
    const body = UpdateAlertRuleBody.parse(request.body);
    
    const rule = await service.updateAlertRule(params.id, userId, body);
    
    if (!rule) {
      return reply.status(404).send({ ok: false, error: 'Rule not found' });
    }
    
    return { ok: true, data: rule };
  });
  
  /**
   * DELETE /api/alerts/rules/:id
   * Delete alert rule
   */
  app.delete('/rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const params = RuleIdParams.parse(request.params);
    
    const deleted = await service.deleteAlertRule(params.id, userId);
    
    if (!deleted) {
      return reply.status(404).send({ ok: false, error: 'Rule not found' });
    }
    
    return { ok: true };
  });
  
  // ========== ALERTS FEED ==========
  
  /**
   * GET /api/alerts/feed
   * Get user's alert feed
   */
  app.get('/feed', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const query = GetAlertFeedQuery.parse(request.query);
    
    const alerts = await service.getAlertFeed(userId, {
      unacknowledgedOnly: query.unacknowledged,
      limit: query.limit,
      offset: query.offset,
    });
    
    const unacknowledgedCount = await service.getUnacknowledgedCount(userId);
    
    return { ok: true, data: alerts, count: alerts.length, unacknowledgedCount };
  });
  
  /**
   * POST /api/alerts/:id/ack
   * Acknowledge alert
   */
  app.post('/:id/ack', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const params = AlertIdParams.parse(request.params);
    
    const alert = await service.acknowledgeAlert(params.id, userId);
    
    if (!alert) {
      return reply.status(404).send({ ok: false, error: 'Alert not found' });
    }
    
    return { ok: true, data: alert };
  });
  
  /**
   * POST /api/alerts/ack-all
   * Acknowledge all alerts
   */
  app.post('/ack-all', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    
    const count = await service.acknowledgeAllAlerts(userId);
    
    return { ok: true, acknowledgedCount: count };
  });
  
  /**
   * GET /api/alerts/stats
   * Get alerts statistics
   */
  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    
    const [alertStats, rulesStats] = await Promise.all([
      service.getAlertsStats(userId),
      rulesRepo.getAlertRulesStats(),
    ]);
    
    return {
      ok: true,
      data: {
        alerts: alertStats,
        rules: rulesStats,
      },
    };
  });
}
