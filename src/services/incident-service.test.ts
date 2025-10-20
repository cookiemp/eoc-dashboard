import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Incident } from '@/lib/types';

// Mock the firebase-admin module before importing the service
vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(),
}));

describe('incident-service', () => {
  let mockFirestore: any;
  let getIncidents: any;
  let addIncidents: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock Firestore
    mockFirestore = {
      collection: vi.fn(() => ({
        doc: vi.fn((id?: string) => ({
          id: id || 'mock-doc-id',
          set: vi.fn(),
          get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
          delete: vi.fn(),
        })),
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
          })),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({ 
              docs: [], 
              size: 0,
              slice: () => []
            })),
          })),
          get: vi.fn(() => Promise.resolve({ 
            docs: [], 
            size: 0,
            slice: () => []
          })),
        })),
      })),
      batch: vi.fn(() => ({
        set: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
        delete: vi.fn(),
      })),
    };

    // Re-import the module after setting up mocks
    const { getFirestore } = await import('@/lib/firebase-admin');
    (getFirestore as any).mockResolvedValue(mockFirestore);

    const service = await import('./incident-service');
    getIncidents = service.getIncidents;
    addIncidents = service.addIncidents;
  });

  describe('getIncidents', () => {
    it('should return empty array when no incidents exist', async () => {
      const incidents = await getIncidents();
      expect(incidents).toEqual([]);
      expect(mockFirestore.collection).toHaveBeenCalledWith('incidents');
    });

    it('should return incidents from Firestore', async () => {
      const mockIncidents = [
        {
          id: 'inc-1',
          title: 'Test Incident',
          description: 'Test Description',
          latitude: 9.0,
          longitude: 38.0,
          color: 'red',
          addedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockFirestore.collection = vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              docs: mockIncidents.map(inc => ({ data: () => inc })),
            })),
          })),
        })),
      }));

      const incidents = await getIncidents();
      expect(incidents).toHaveLength(1);
      expect(incidents[0].title).toBe('Test Incident');
    });

    it('should handle Firestore errors gracefully', async () => {
      mockFirestore.collection = vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.reject(new Error('Firestore error'))),
          })),
        })),
      }));

      // Should fall back to file cache (may return data if file exists)
      const incidents = await getIncidents();
      expect(Array.isArray(incidents)).toBe(true);
    });
  });

  describe('addIncidents', () => {
    it('should add new incidents to Firestore', async () => {
      const newIncidents: Incident[] = [
        {
          title: 'New Incident',
          description: 'New Description',
          latitude: 10.0,
          longitude: 40.0,
          color: 'blue',
        },
      ];

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
        delete: vi.fn(),
      };

      mockFirestore.batch = vi.fn(() => mockBatch);
      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          id: 'new-doc-id',
        })),
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({ empty: true })),
          })),
        })),
        orderBy: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ 
            size: 1, 
            docs: [],
            slice: () => []
          })),
        })),
      }));

      await addIncidents(newIncidents);

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should not add duplicate incidents', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
        delete: vi.fn(),
      };

      mockFirestore.batch = vi.fn(() => mockBatch);
      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({ id: 'doc-id' })),
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({ 
              empty: false, 
              docs: [{ data: () => ({ title: 'Existing Incident' }) }]
            })),
          })),
        })),
        orderBy: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ 
            size: 1, 
            docs: [],
            slice: () => []
          })),
        })),
      }));

      const duplicateIncidents: Incident[] = [
        {
          title: 'Existing Incident',
          description: 'Description',
          latitude: 10.0,
          longitude: 40.0,
          color: 'blue',
        },
      ];

      await addIncidents(duplicateIncidents);

      expect(mockBatch.set).not.toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle empty incident array', async () => {
      await addIncidents([]);
      expect(mockFirestore.collection).not.toHaveBeenCalled();
    });
  });
});
