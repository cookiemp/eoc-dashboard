import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(),
}));

describe('dashboard-cache-service', () => {
  let mockFirestore: any;
  let getCachedDashboardData: any;
  let setCachedDashboardData: any;
  let clearDashboardCache: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFirestore = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ exists: false })),
          set: vi.fn(() => Promise.resolve()),
          delete: vi.fn(() => Promise.resolve()),
        })),
      })),
    };

    const { getFirestore } = await import('@/lib/firebase-admin');
    (getFirestore as any).mockResolvedValue(mockFirestore);

    const service = await import('./dashboard-cache-service');
    getCachedDashboardData = service.getCachedDashboardData;
    setCachedDashboardData = service.setCachedDashboardData;
    clearDashboardCache = service.clearDashboardCache;
  });

  describe('getCachedDashboardData', () => {
    it('should return null when no cache exists', async () => {
      const result = await getCachedDashboardData();
      expect(result).toBeNull();
    });

    it('should return null when Firebase is unavailable', async () => {
      const { getFirestore } = await import('@/lib/firebase-admin');
      (getFirestore as any).mockResolvedValue(null);

      const result = await getCachedDashboardData();
      expect(result).toBeNull();
    });

    it('should return cached data when valid', async () => {
      const mockCachedData = {
        humanitarian: [
          {
            id: '1',
            title: 'Test Article',
            source: 'Test Source',
            snippet: 'Test snippet',
            url: 'https://test.com',
            category: 'humanitarian' as const,
            confidence: 0.9,
            reasoning: 'Test reasoning',
          },
        ],
        general: [],
        incidents: [],
        summary: { humanitarianCount: 1, generalCount: 0 },
        lastUpdated: new Date().toISOString(),
        cacheValidUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      };

      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({
            exists: true,
            data: () => mockCachedData,
          })),
        })),
      }));

      const result = await getCachedDashboardData();
      expect(result).toBeTruthy();
      expect(result?.humanitarian).toHaveLength(1);
      expect(result?.summary.humanitarianCount).toBe(1);
    });

    it('should return null when cache is expired', async () => {
      const mockExpiredData = {
        humanitarian: [],
        general: [],
        incidents: [],
        summary: { humanitarianCount: 0, generalCount: 0 },
        lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
        cacheValidUntil: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago (expired)
      };

      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({
            exists: true,
            data: () => mockExpiredData,
          })),
        })),
      }));

      const result = await getCachedDashboardData();
      expect(result).toBeNull();
    });
  });

  describe('setCachedDashboardData', () => {
    it('should cache dashboard data successfully', async () => {
      const mockSet = vi.fn(() => Promise.resolve());
      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          set: mockSet,
        })),
      }));

      const humanitarian = [
        {
          id: '1',
          title: 'Test',
          source: 'Source',
          snippet: 'Snippet',
          url: 'https://test.com',
          category: 'humanitarian' as const,
          confidence: 0.9,
          reasoning: 'Reasoning',
        },
      ];
      const general: any[] = [];
      const incidents: any[] = [];

      await setCachedDashboardData(humanitarian, general, incidents);

      expect(mockSet).toHaveBeenCalled();
      if (mockSet.mock.calls.length > 0) {
        const firstCall = mockSet.mock.calls[0] as any[];
        if (firstCall && firstCall.length > 0 && firstCall[0]) {
          const cachedData = firstCall[0] as any;
          expect(cachedData.humanitarian).toHaveLength(1);
          expect(cachedData.summary.humanitarianCount).toBe(1);
          expect(cachedData.summary.generalCount).toBe(0);
        }
      }
    });

    it('should not crash when Firebase is unavailable', async () => {
      const { getFirestore } = await import('@/lib/firebase-admin');
      (getFirestore as any).mockResolvedValue(null);

      await expect(setCachedDashboardData([], [], [])).resolves.not.toThrow();
    });
  });

  describe('clearDashboardCache', () => {
    it('should clear cache successfully', async () => {
      const mockDelete = vi.fn(() => Promise.resolve());
      mockFirestore.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          delete: mockDelete,
        })),
      }));

      await clearDashboardCache();

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should not crash when Firebase is unavailable', async () => {
      const { getFirestore } = await import('@/lib/firebase-admin');
      (getFirestore as any).mockResolvedValue(null);

      await expect(clearDashboardCache()).resolves.not.toThrow();
    });
  });
});
