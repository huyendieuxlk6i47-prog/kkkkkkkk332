/**
 * Telegram Bot Routes
 * 
 * Handles:
 * - Webhook for incoming messages from Telegram
 * - Connection management endpoints
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as telegramService from './telegram.service.js';

// Helper to get userId from request
function getUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'] as string;
  return userId || 'anonymous';
}

export async function telegramRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/telegram/webhook
   * Telegram bot webhook - receives updates from Telegram
   */
  app.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const update = request.body as any;
    
    try {
      // Handle incoming message
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id.toString();
        const text = message.text || '';
        const username = message.from?.username;
        const firstName = message.from?.first_name;
        
        // Check if it's a /start command with connection code
        if (text.startsWith('/start ')) {
          const code = text.replace('/start ', '').trim();
          const userId = telegramService.validatePendingConnection(code);
          
          if (userId) {
            // Save connection
            await telegramService.saveTelegramConnection(userId, chatId, username, firstName);
            telegramService.completePendingConnection(code);
            
            // P0 FIX: Send proper success message
            await telegramService.sendTelegramMessage(
              chatId,
              `✅ <b>Telegram connected successfully</b>

You'll now receive alerts here when your monitored tokens or wallets show important activity.

ℹ️ <b>What happens next:</b>
• Create alert rules on the website
• I'll notify you when conditions are met
• You can mute or adjust alerts anytime

Type /help for available commands.`,
              { parseMode: 'HTML' }
            );
          } else {
            // Invalid or expired code
            await telegramService.sendTelegramMessage(
              chatId,
              `❌ <b>Invalid or expired link</b>\n\nPlease generate a new connection link from BlockView settings.`,
              { parseMode: 'HTML' }
            );
          }
        } 
        // P0 FIX: Handle plain /start with proper welcome message
        else if (text === '/start') {
          await telegramService.sendTelegramMessage(
            chatId,
            `👋 <b>Welcome to FOMO Alerts</b>

This bot notifies you when important on-chain behavior is detected.

You'll receive alerts about:
• Large transfers
• Consistent buying or selling  
• Smart money activity
• Unusual wallet or token behavior

🔔 Alerts are sent only when conditions you selected are met — no spam.

<b>To get started:</b>
1. Go to crypto-insights-52.preview.emergentagent.com
2. Track a token or wallet
3. Create an alert

Once alerts are active, notifications will appear here automatically.

Type /help anytime for commands.`,
            { parseMode: 'HTML' }
          );
        }
        // Handle /status
        else if (text === '/status') {
          const connection = await telegramService.TelegramConnectionModel.findOne({ chatId });
          
          if (connection?.isActive) {
            await telegramService.sendTelegramMessage(
              chatId,
              `✅ <b>Connection Active</b>\n\nUser ID: ${connection.userId}\nConnected: ${connection.connectedAt.toLocaleDateString()}`,
              { parseMode: 'HTML' }
            );
          } else {
            await telegramService.sendTelegramMessage(
              chatId,
              `❌ <b>Not Connected</b>\n\nUse /start with a connection link from BlockView to connect your account.`,
              { parseMode: 'HTML' }
            );
          }
        }
        // Handle /disconnect
        else if (text === '/disconnect') {
          const connection = await telegramService.TelegramConnectionModel.findOne({ chatId });
          
          if (connection) {
            await telegramService.disconnectTelegram(connection.userId);
            await telegramService.sendTelegramMessage(
              chatId,
              `👋 <b>Disconnected</b>\n\nYou will no longer receive alerts here. Use /start to reconnect.`,
              { parseMode: 'HTML' }
            );
          }
        }
        // Handle /help
        else if (text === '/help') {
          await telegramService.sendTelegramMessage(
            chatId,
            `📖 <b>BlockView Bot Commands</b>\n\n/start - Connect your account\n/status - Check connection status\n/disconnect - Stop receiving alerts\n/help - Show this message\n\n🌐 <a href="https://blockview.app">blockview.app</a>`,
            { parseMode: 'HTML' }
          );
        }
      }
      
      return { ok: true };
    } catch (err) {
      console.error('[Telegram Webhook] Error:', err);
      return { ok: true }; // Always return ok to Telegram
    }
  });

  /**
   * GET /api/telegram/connection
   * Get user's Telegram connection status
   */
  app.get('/connection', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    
    const connection = await telegramService.getTelegramConnection(userId);
    
    return {
      ok: true,
      data: connection ? {
        connected: connection.isActive,
        username: connection.username,
        connectedAt: connection.connectedAt,
      } : {
        connected: false,
      },
    };
  });

  /**
   * POST /api/telegram/connect
   * Generate connection link for user
   */
  app.post('/connect', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    
    const code = telegramService.createPendingConnection(userId);
    const botUsername = 'FOMO_a_bot';
    const link = `https://t.me/${botUsername}?start=${code}`;
    
    return {
      ok: true,
      data: {
        code,
        link,
        expiresIn: 600, // 10 minutes
      },
    };
  });

  /**
   * POST /api/telegram/disconnect
   * Disconnect user's Telegram
   */
  app.post('/disconnect', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    
    const disconnected = await telegramService.disconnectTelegram(userId);
    
    return {
      ok: true,
      disconnected,
    };
  });

  /**
   * POST /api/telegram/test
   * Send test notification
   */
  app.post('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    
    const result = await telegramService.sendAlertNotification(userId, {
      title: 'Test Alert',
      message: 'This is a test notification from BlockView. If you see this, your Telegram connection is working!',
      scope: 'token',
      targetId: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      signalType: 'accumulation',
      confidence: 0.85,
      severity: 70,
    });
    
    return {
      ok: result.ok,
      error: result.error,
    };
  });
  
  app.log.info('Telegram routes registered');
}
