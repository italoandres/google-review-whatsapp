import fc from 'fast-check';
import {
  insertConnectionHistory,
  getConnectionHistoryByUserId,
} from './connectionHistory';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

/**
 * Feature: whatsapp-multi-tenant-auto-instance
 * Property 35: Connection History Recording
 * 
 * **Validates: Requirements 25.1, 25.4**
 * 
 * For any connection or disconnection event, an entry should be created
 * in the connection history with timestamp, event type, and status.
 */
describe('Property Test - Connection History Recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record any connection/disconnection event with all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random connection history inputs
        fc.record({
          userId: fc.uuid(),
          instanceName: fc.uuid().map(id => `user-${id}`),
          eventType: fc.constantFrom('connected', 'disconnected', 'created', 'deleted', 'error'),
          status: fc.oneof(
            fc.constant('disconnected'),
            fc.constant('connecting'),
            fc.constant('connected'),
            fc.constant('error')
          ),
          details: fc.option(
            fc.record({
              reason: fc.string({ minLength: 1, maxLength: 50 }),
              code: fc.integer({ min: 100, max: 599 }),
            }),
            { nil: undefined }
          ),
        }),
        async (input) => {
          // Mock the database response
          const mockData = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: input.userId,
            instance_name: input.instanceName,
            event_type: input.eventType,
            status: input.status,
            details: input.details || null,
            created_at: new Date().toISOString(),
          };

          const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
          const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
          const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
          const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

          (supabase.from as any) = mockFrom;

          // Insert the history entry
          const result = await insertConnectionHistory(input as any);

          // Verify all required fields are present
          expect(result.id).toBeDefined();
          expect(result.userId).toBe(input.userId);
          expect(result.instanceName).toBe(input.instanceName);
          expect(result.eventType).toBe(input.eventType);
          expect(result.status).toBe(input.status);
          expect(result.createdAt).toBeDefined();

          // Verify timestamp is valid ISO string
          expect(() => new Date(result.createdAt)).not.toThrow();

          // Verify details are preserved if provided
          if (input.details) {
            expect(result.details).toEqual(input.details);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain chronological order when retrieving history', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(
          fc.record({
            instanceName: fc.uuid().map(id => `user-${id}`),
            eventType: fc.constantFrom('connected', 'disconnected'),
            status: fc.constantFrom('connected', 'disconnected'),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (userId, events) => {
          // Use a fixed base timestamp to avoid race conditions
          const baseTime = new Date('2024-01-15T10:00:00Z').getTime();
          
          // Mock database to return events in reverse chronological order
          const mockEvents = events.map((event, index) => ({
            id: `event-${index}`,
            user_id: userId,
            instance_name: event.instanceName,
            event_type: event.eventType,
            status: event.status,
            details: null,
            // Newest events first (index 0 is most recent)
            created_at: new Date(baseTime - index * 60000).toISOString(),
          }));

          const mockRange = jest.fn().mockResolvedValue({ data: mockEvents, error: null });
          const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

          (supabase.from as any) = mockFrom;

          const result = await getConnectionHistoryByUserId(userId);

          // Verify events are in reverse chronological order (newest first)
          for (let i = 0; i < result.length - 1; i++) {
            const current = new Date(result[i].createdAt).getTime();
            const next = new Date(result[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle pagination correctly for any limit/offset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 100 }),
        async (userId, limit, offset) => {
          // Mock database response
          const mockData = Array.from({ length: limit }, (_, i) => ({
            id: `event-${offset + i}`,
            user_id: userId,
            instance_name: `user-${userId}`,
            event_type: 'connected',
            status: 'connected',
            details: null,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
          }));

          const mockRange = jest.fn().mockResolvedValue({ data: mockData, error: null });
          const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

          (supabase.from as any) = mockFrom;

          const result = await getConnectionHistoryByUserId(userId, { limit, offset });

          // Verify correct number of results
          expect(result.length).toBeLessThanOrEqual(limit);

          // Verify range was called with correct parameters
          expect(mockRange).toHaveBeenCalledWith(offset, offset + limit - 1);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve event details structure through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          instanceName: fc.uuid().map(id => `user-${id}`),
          eventType: fc.constantFrom('connected', 'disconnected'),
          status: fc.string({ minLength: 1, maxLength: 20 }),
          details: fc.record({
            timestamp: fc.date().map(d => d.toISOString()),
            source: fc.constantFrom('webhook', 'api', 'manual'),
            metadata: fc.record({
              ip: fc.ipV4(),
              userAgent: fc.string({ minLength: 10, maxLength: 50 }),
            }),
          }),
        }),
        async (input) => {
          // Mock insert
          const mockInsertData = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: input.userId,
            instance_name: input.instanceName,
            event_type: input.eventType,
            status: input.status,
            details: input.details,
            created_at: new Date().toISOString(),
          };

          const mockSingle = jest.fn().mockResolvedValue({ data: mockInsertData, error: null });
          const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
          const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
          const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

          (supabase.from as any) = mockFrom;

          const result = await insertConnectionHistory(input as any);

          // Verify details structure is preserved
          expect(result.details).toEqual(input.details);
          expect(JSON.stringify(result.details)).toBe(JSON.stringify(input.details));
        }
      ),
      { numRuns: 50 }
    );
  });
});
