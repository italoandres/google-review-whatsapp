import fc from 'fast-check';
import { WebhookHandler, WebhookPayload } from './webhookHandler';
import * as whatsappInstanceModel from '../models/whatsappInstance';
import * as connectionHistoryModel from '../models/connectionHistory';
import * as webhookLogModel from '../models/webhookLog';

// Mock Supabase first
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('../models/webhookLog');
jest.mock('../models/whatsappInstance');
jest.mock('../models/connectionHistory');

/**
 * Generator for connection.update webhook events
 */
function connectionUpdateGenerator(): fc.Arbitrary<WebhookPayload> {
  return fc.record({
    event: fc.constant('connection.update'),
    instance: fc.string({ minLength: 5, maxLength: 50 }),
    data: fc.record({
      state: fc.constantFrom('open', 'close', 'connecting'),
    }),
    date_time: fc.option(fc.date().map(d => d.toISOString())),
  });
}

/**
 * Generator for messages.upsert webhook events
 */
function messageUpsertGenerator(): fc.Arbitrary<WebhookPayload> {
  return fc.record({
    event: fc.constant('messages.upsert'),
    instance: fc.string({ minLength: 5, maxLength: 50 }),
    data: fc.record({
      key: fc.option(fc.record({
        remoteJid: fc.string({ minLength: 5, maxLength: 50 }),
        fromMe: fc.boolean(),
      })),
      pushName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      message: fc.option(fc.object()),
    }),
    date_time: fc.option(fc.date().map(d => d.toISOString())),
  });
}

describe('Webhook Event Processing Property Tests', () => {
  let handler: WebhookHandler;
  
  beforeEach(() => {
    handler = new WebhookHandler();
    jest.clearAllMocks();
    
    // Setup default mocks
    (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({
      id: 'log-123',
      processed: false,
    });
  });
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 22: Connection Status Update on Webhook
   * 
   * **Validates: Requirements 15.1, 20.3**
   * 
   * For any webhook event of type "connection.update", the connection status
   * in the database should be updated accordingly.
   */
  describe('Property 22: Connection Status Update on Webhook', () => {
    it('should update database status for any connection.update event', async () => {
      await fc.assert(
        fc.asyncProperty(
          connectionUpdateGenerator(),
          async (payload) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            
            // Mock instance exists
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connecting',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            (connectionHistoryModel.insertConnectionHistory as jest.Mock).mockResolvedValue({});
            (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({ id: 'log-123' });
            
            // Process event
            const result = await handler.handleEvent(payload);
            
            // Should succeed
            expect(result.success).toBe(true);
            
            // Should update instance status
            expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalled();
            
            const updateCall = (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mock.calls[0];
            const [userId, updates] = updateCall;
            
            // Should update to correct status based on state
            if (payload.data.state === 'open') {
              expect(updates.status).toBe('connected');
              expect(updates.connectedAt).toBeDefined();
            } else if (payload.data.state === 'close') {
              expect(updates.status).toBe('disconnected');
              expect(updates.disconnectedAt).toBeDefined();
            } else if (payload.data.state === 'connecting') {
              expect(updates.status).toBe('connecting');
            }
            
            // Should always update lastActivityAt
            expect(updates.lastActivityAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should record connection event in history for any state change', async () => {
      await fc.assert(
        fc.asyncProperty(
          connectionUpdateGenerator(),
          async (payload) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            
            // Mock instance exists
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connecting',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            (connectionHistoryModel.insertConnectionHistory as jest.Mock).mockResolvedValue({});
            (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({ id: 'log-123' });
            
            // Process event
            await handler.handleEvent(payload);
            
            // Should record in history
            expect(connectionHistoryModel.insertConnectionHistory).toHaveBeenCalled();
            
            const historyCall = (connectionHistoryModel.insertConnectionHistory as jest.Mock).mock.calls[0];
            const [historyEntry] = historyCall;
            
            // Should have correct fields
            expect(historyEntry.userId).toBe('user-123');
            expect(historyEntry.instanceName).toBe(payload.instance);
            expect(historyEntry.eventType).toMatch(/^(connected|disconnected)$/);
            expect(historyEntry.details).toBeDefined();
            expect(historyEntry.details.state).toBe(payload.data.state);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should map Evolution API states to correct internal status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('open', 'close', 'connecting'),
          async (state) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            
            const payload: WebhookPayload = {
              event: 'connection.update',
              instance: 'test-instance',
              data: { state },
            };
            
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: 'test-instance',
              status: 'connecting',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            (connectionHistoryModel.insertConnectionHistory as jest.Mock).mockResolvedValue({});
            (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({ id: 'log-123' });
            
            await handler.handleEvent(payload);
            
            const updateCall = (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mock.calls[0];
            const [, updates] = updateCall;
            
            // Verify correct mapping
            const expectedStatus = state === 'open' ? 'connected' : 
                                 state === 'close' ? 'disconnected' : 
                                 'connecting';
            expect(updates.status).toBe(expectedStatus);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 23: Message Processing on Webhook
   * 
   * **Validates: Requirements 20.4**
   * 
   * For any webhook event of type "messages.upsert", the message should be
   * processed and logged.
   */
  describe('Property 23: Message Processing on Webhook', () => {
    it('should process any messages.upsert event successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageUpsertGenerator(),
          async (payload) => {
            // Mock instance exists
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connected',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            
            // Process event
            const result = await handler.handleEvent(payload);
            
            // Should succeed
            expect(result.success).toBe(true);
            expect(result.message).toBe('Message processed');
            
            // Should update last activity
            expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalledWith(
              'user-123',
              expect.objectContaining({
                lastActivityAt: expect.any(String),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should extract client ID from message when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageUpsertGenerator().filter(p => p.data.key !== null && p.data.key !== undefined),
          async (payload) => {
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connected',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            
            const result = await handler.handleEvent(payload);
            
            // If key exists, should extract remoteJid
            if (payload.data.key && payload.data.key.remoteJid) {
              expect(result.clientId).toBe(payload.data.key.remoteJid);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should handle messages without client ID gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            event: fc.constant('messages.upsert'),
            instance: fc.string({ minLength: 5, maxLength: 50 }),
            data: fc.record({
              message: fc.option(fc.object()),
            }),
          }),
          async (payload) => {
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connected',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            
            // Should not throw
            const result = await handler.handleEvent(payload as WebhookPayload);
            
            expect(result.success).toBe(true);
            // clientId may be undefined, which is acceptable
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should always update last activity timestamp for messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageUpsertGenerator(),
          async (payload) => {
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connected',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            
            await handler.handleEvent(payload);
            
            // Should always update last activity
            expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalled();
            
            const updateCall = (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mock.calls[0];
            const [userId, updates] = updateCall;
            
            expect(userId).toBe('user-123');
            expect(updates.lastActivityAt).toBeDefined();
            
            // Timestamp should be recent (within last second)
            const timestamp = new Date(updates.lastActivityAt);
            const now = new Date();
            const diffMs = now.getTime() - timestamp.getTime();
            expect(diffMs).toBeLessThan(1000);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  /**
   * Additional property: Webhook events should always be logged
   */
  describe('Property: All Events Logged', () => {
    it('should log every webhook event regardless of type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(connectionUpdateGenerator(), messageUpsertGenerator()),
          async (payload) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            
            (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
              id: 'instance-123',
              userId: 'user-123',
              instanceName: payload.instance,
              status: 'connected',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
            (connectionHistoryModel.insertConnectionHistory as jest.Mock).mockResolvedValue({});
            (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({ id: 'log-123' });
            
            await handler.handleEvent(payload);
            
            // Should always log the event
            expect(webhookLogModel.insertWebhookLog).toHaveBeenCalled();
            
            const logCall = (webhookLogModel.insertWebhookLog as jest.Mock).mock.calls[0];
            const [logEntry] = logCall;
            
            expect(logEntry.instanceName).toBe(payload.instance);
            expect(logEntry.eventType).toBe(payload.event);
            expect(logEntry.payload).toEqual(payload);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
