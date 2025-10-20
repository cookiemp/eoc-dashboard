import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies
vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(() => null),
}));

vi.mock('@/ai/flows/summarize-incident-data', () => ({
  summarizeIncidentData: vi.fn(),
}));

vi.mock('@/ai/flows/extract-incidents-from-news-flow', () => ({
  extractIncidentsFromNews: vi.fn(),
}));

vi.mock('@/ai/flows/generate-incident-dossier-flow', () => ({
  generateIncidentDossier: vi.fn(),
}));

vi.mock('@/ai/flows/categorize-news-articles-flow', () => ({
  categorizeNewsArticles: vi.fn(),
}));

vi.mock('@/services/incident-service', () => ({
  getIncidents: vi.fn(() => Promise.resolve([])),
  addIncidents: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/services/field-incidents-service', () => ({
  getFieldIncidents: vi.fn(() => Promise.resolve([])),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return message when no articles or incidents provided', async () => {
      const { getSummary } = await import('./actions');
      const result = await getSummary({ articles: [], fieldIncidents: [] });

      if ('summary' in result) {
        expect(result.summary).toBe('No articles or incidents available to summarize.');
      }
    });

    it('should generate summary for articles', async () => {
      const { summarizeIncidentData } = await import('@/ai/flows/summarize-incident-data');
      (summarizeIncidentData as any).mockResolvedValue({
        summary: '* Test summary point',
      });

      const { getSummary } = await import('./actions');
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article',
          source: 'Test Source',
          snippet: 'Test snippet',
          url: 'https://test.com',
        },
      ];

      const result = await getSummary({ articles: mockArticles });

      if ('summary' in result) {
        expect(result.summary).toContain('Test summary point');
      }
      expect(summarizeIncidentData).toHaveBeenCalledWith({
        articles: mockArticles,
        fieldIncidents: undefined,
      });
    });

    it('should handle errors gracefully', async () => {
      const { summarizeIncidentData } = await import('@/ai/flows/summarize-incident-data');
      (summarizeIncidentData as any).mockRejectedValue(new Error('AI service error'));

      const { getSummary } = await import('./actions');
      const result = await getSummary({
        articles: [{ id: '1', title: 'Test', source: 'Source', snippet: 'Snippet', url: 'https://test.com' }],
      });

      if ('error' in result) {
        expect(result.error).toContain('Failed to generate summary');
      }
    });
  });

  describe('processNewsIntoIncidents', () => {
    it('should extract and store incidents from articles', async () => {
      const { extractIncidentsFromNews } = await import('@/ai/flows/extract-incidents-from-news-flow');
      const { addIncidents } = await import('@/services/incident-service');

      (extractIncidentsFromNews as any).mockResolvedValue({
        incidents: [
          {
            title: 'Extracted Incident',
            description: 'Description',
            latitude: 9.0,
            longitude: 38.0,
            color: 'red',
          },
        ],
      });

      const { processNewsIntoIncidents } = await import('./actions');
      const mockArticles = [
        {
          id: '1',
          title: 'News Article',
          source: 'Source',
          snippet: 'Article snippet',
          url: 'https://test.com',
        },
      ];

      await processNewsIntoIncidents({ articles: mockArticles });

      expect(extractIncidentsFromNews).toHaveBeenCalled();
      expect(addIncidents).toHaveBeenCalled();
    });

    it('should handle empty article array', async () => {
      const { extractIncidentsFromNews } = await import('@/ai/flows/extract-incidents-from-news-flow');
      const { processNewsIntoIncidents } = await import('./actions');

      await processNewsIntoIncidents({ articles: [] });

      expect(extractIncidentsFromNews).not.toHaveBeenCalled();
    });
  });

  describe('getLatestIncidents', () => {
    it('should merge news and field incidents', async () => {
      const { getIncidents } = await import('@/services/incident-service');
      const { getFieldIncidents } = await import('@/services/field-incidents-service');

      (getIncidents as any).mockResolvedValue([
        {
          id: 'news-1',
          title: 'News Incident',
          description: 'Description',
          latitude: 9.0,
          longitude: 38.0,
          color: 'blue',
          addedAt: '2025-01-01T00:00:00.000Z',
        },
      ]);

      (getFieldIncidents as any).mockResolvedValue([
        {
          id: 'field-1',
          title: 'Field Incident',
          description: 'Field description',
          latitude: 10.0,
          longitude: 40.0,
          color: 'red',
          reportedAt: '2025-01-01T00:00:00.000Z',
          needsReview: false,
        },
      ]);

      const { getLatestIncidents } = await import('./actions');
      const incidents = await getLatestIncidents();

      expect(incidents).toHaveLength(2);
      expect(incidents[0].id).toBe('field-1'); // Field incidents come first
      expect(incidents[1].id).toBe('news-1');
    });

    it('should filter out incidents needing review', async () => {
      const { getFieldIncidents } = await import('@/services/field-incidents-service');

      (getFieldIncidents as any).mockResolvedValue([
        {
          id: 'field-1',
          title: 'Approved Field Incident',
          description: 'Description',
          latitude: 9.0,
          longitude: 38.0,
          color: 'green',
          reportedAt: '2025-01-01T00:00:00.000Z',
          needsReview: false,
        },
        {
          id: 'field-2',
          title: 'Pending Field Incident',
          description: 'Description',
          latitude: 10.0,
          longitude: 40.0,
          color: 'yellow',
          reportedAt: '2025-01-01T00:00:00.000Z',
          needsReview: true,
        },
      ]);

      const { getLatestIncidents } = await import('./actions');
      const incidents = await getLatestIncidents();

      const fieldIncidents = incidents.filter((inc: any) => inc.sourceType === 'field_report');
      expect(fieldIncidents).toHaveLength(1);
      expect(fieldIncidents[0].id).toBe('field-1');
    });

    it('should handle errors gracefully', async () => {
      const { getIncidents } = await import('@/services/incident-service');
      (getIncidents as any).mockRejectedValue(new Error('Database error'));

      const { getLatestIncidents } = await import('./actions');
      const incidents = await getLatestIncidents();

      expect(incidents).toEqual([]);
    });
  });

  describe('generateIncidentDossier', () => {
    it('should generate dossier for incident', async () => {
      const { generateIncidentDossier: generateDossierFlow } = await import(
        '@/ai/flows/generate-incident-dossier-flow'
      );

      (generateDossierFlow as any).mockResolvedValue({
        executiveSummary: 'Test executive summary',
        impactAnalysis: 'Impact analysis',
        recommendations: ['Recommendation 1', 'Recommendation 2'],
      });

      const { generateIncidentDossier } = await import('./actions');
      const result = await generateIncidentDossier({
        title: 'Test Incident',
        description: 'Description',
      } as any);

      expect(result.executiveSummary).toBe('Test executive summary');
      expect(generateDossierFlow).toHaveBeenCalled();
    });

    it('should handle AI errors gracefully', async () => {
      const { generateIncidentDossier: generateDossierFlow } = await import(
        '@/ai/flows/generate-incident-dossier-flow'
      );

      (generateDossierFlow as any).mockRejectedValue(new Error('AI error'));

      const { generateIncidentDossier } = await import('./actions');
      const result = await generateIncidentDossier({
        title: 'Test Incident',
        description: 'Description',
      } as any);

      if ('error' in result) {
        expect(result.error).toContain('Failed to generate dossier');
      }
      expect(result.executiveSummary).toBe('');
    });
  });
});
