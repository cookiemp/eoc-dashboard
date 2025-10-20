import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FieldIncident } from './field-incidents-service';

vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(),
}));

describe('field-incidents-service', () => {
  let mockFirestore: any;
  let getFieldIncidents: any;
  let addFieldIncidents: any;
  let approveIncident: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFirestore = {
      collection: vi.fn(() => ({
        doc: vi.fn((id?: string) => ({
          id: id || 'mock-field-id',
          set: vi.fn(() => Promise.resolve()),
          update: vi.fn(() => Promise.resolve()),
          delete: vi.fn(() => Promise.resolve()),
        })),
        where: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve({ docs: [] })),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve({ docs: [] })),
            })),
          })),
        })),
      })),
      batch: vi.fn(() => ({
        set: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
      })),
    };

    const { getFirestore } = await import('@/lib/firebase-admin');
    (getFirestore as any).mockResolvedValue(mockFirestore);

    const service = await import('./field-incidents-service');
    getFieldIncidents = service.getFieldIncidents;
    addFieldIncidents = service.addFieldIncidents;
    approveIncident = service.approveIncident;
  });

  describe('getFieldIncidents', () => {
    it('should return empty array when Firebase is not available', async () => {
      const { getFirestore } = await import('@/lib/firebase-admin');
      (getFirestore as any).mockResolvedValue(null);

      const incidents = await getFieldIncidents();
      expect(incidents).toEqual([]);
    });

    it('should fetch active field incidents', async () => {
      const mockIncidents = [
        {
          id: 'field-1',
          title: 'Field Report 1',
          description: 'Test field report',
          latitude: 9.0,
          longitude: 38.0,
          color: 'red',
          category: 'health',
          severity: 'high',
          locationName: 'Addis Ababa',
          sourceType: 'field_report',
          reportedBy: 'Tester',
          reportedAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
          needsReview: false,
          confidence: 0.9,
        },
      ];

      mockFirestore.collection = vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve({
                docs: mockIncidents.map(inc => ({
                  id: inc.id,
                  data: () => inc,
                })),
              })),
            })),
          })),
        })),
      }));

      const incidents = await getFieldIncidents();
      expect(incidents).toHaveLength(1);
      expect(incidents[0].title).toBe('Field Report 1');
      expect(incidents[0].category).toBe('health');
    });
  });

  describe('addFieldIncidents', () => {
    it('should add field incidents successfully', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
      };

      mockFirestore.batch = vi.fn(() => mockBatch);

      const newIncidents = [
        {
          title: 'New Field Incident',
          description: 'Test description',
          latitude: 10.0,
          longitude: 40.0,
          color: 'blue',
          category: 'food_security' as const,
          severity: 'medium' as const,
          locationName: 'Test Location',
          reportedBy: 'Test User',
          needsReview: true,
          confidence: 0.8,
        },
      ];

      const result = await addFieldIncidents(newIncidents, false);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should auto-approve incidents when specified', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
      };

      mockFirestore.batch = vi.fn(() => mockBatch);

      const newIncidents = [
        {
          title: 'Auto Approved Incident',
          description: 'Description',
          latitude: 10.0,
          longitude: 40.0,
          color: 'green',
          category: 'wash' as const,
          severity: 'low' as const,
          locationName: 'Location',
          reportedBy: 'User',
          needsReview: false,
          confidence: 0.95,
        },
      ];

      await addFieldIncidents(newIncidents, true);

      // Verify that needsReview is set to false when auto-approve is true
      const setCall = mockBatch.set.mock.calls[0];
      expect(setCall[1]).toMatchObject({ needsReview: false });
    });

    it('should return error when Firebase is unavailable', async () => {
      const { getFirestore } = await import('@/lib/firebase-admin');
      (getFirestore as any).mockResolvedValue(null);

      const result = await addFieldIncidents([
        {
          title: 'Test',
          description: 'Test',
          latitude: 10.0,
          longitude: 40.0,
          color: 'red',
          category: 'other' as const,
          severity: 'low' as const,
          locationName: 'Test',
          reportedBy: 'Test',
          needsReview: true,
          confidence: 0.5,
        },
      ]);

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
      expect(result.error).toBe('Firebase not available');
    });
  });

  describe('approveIncident', () => {
    it('should approve an incident successfully', async () => {
      const mockUpdate = vi.fn(() => Promise.resolve());
      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          update: mockUpdate,
        })),
      }));

      const result = await approveIncident('test-incident-id');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ needsReview: false });
    });

    it('should return false when Firebase is unavailable', async () => {
      const { getFirestore } = await import('@/lib/firebase-admin');
      (getFirestore as any).mockResolvedValue(null);

      const result = await approveIncident('test-id');
      expect(result).toBe(false);
    });
  });
});
