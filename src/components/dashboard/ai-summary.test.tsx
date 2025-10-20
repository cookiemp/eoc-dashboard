import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AiSummary from './ai-summary';

// Mock the server action
vi.mock('@/app/actions', () => ({
  getSummary: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AiSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<AiSummary articles={[]} isLoadingNews={true} />);
    
    expect(screen.getByText('AI-Powered Daily Briefing')).toBeInTheDocument();
  });

  it('should display message when no articles available', async () => {
    const { getSummary } = await import('@/app/actions');
    (getSummary as any).mockResolvedValue({ summary: 'No articles or incidents available to summarize.' });

    render(<AiSummary articles={[]} isLoadingNews={false} />);

    await waitFor(() => {
      expect(screen.getByText('No summary available. Please check back later.')).toBeInTheDocument();
    });
  });

  it('should generate and display summary for articles', async () => {
    const { getSummary } = await import('@/app/actions');
    (getSummary as any).mockResolvedValue({
      summary: '* Test summary point 1\n* Test summary point 2',
    });

    const mockArticles = [
      {
        id: '1',
        title: 'Test Article',
        source: 'Test Source',
        snippet: 'Test snippet',
        url: 'https://test.com',
      },
    ];

    render(<AiSummary articles={mockArticles} isLoadingNews={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Test summary point 1/)).toBeInTheDocument();
      expect(screen.getByText(/Test summary point 2/)).toBeInTheDocument();
    });
  });

  it('should highlight health alerts', async () => {
    const { getSummary } = await import('@/app/actions');
    (getSummary as any).mockResolvedValue({
      summary: '⚕️* Health alert: Disease outbreak detected',
    });

    const mockArticles = [
      {
        id: '1',
        title: 'Health Alert',
        source: 'WHO',
        snippet: 'Disease outbreak',
        url: 'https://test.com',
      },
    ];

    render(<AiSummary articles={mockArticles} isLoadingNews={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Public health related alerts identified/)).toBeInTheDocument();
      expect(screen.getByText(/Disease outbreak detected/)).toBeInTheDocument();
    });
  });

  it('should include field incidents in summary', async () => {
    const { getSummary } = await import('@/app/actions');
    (getSummary as any).mockResolvedValue({
      summary: '* Field report from Addis Ababa [More](#field-1)',
    });

    const mockArticles = [
      {
        id: '1',
        title: 'News Article',
        source: 'Source',
        snippet: 'Snippet',
        url: 'https://test.com',
      },
    ];

    const mockFieldIncidents = [
      {
        id: 'field-1',
        title: 'Field Report',
        description: 'Description',
        latitude: 9.0,
        longitude: 38.0,
        color: 'red',
        category: 'health' as const,
        severity: 'high' as const,
        locationName: 'Addis Ababa',
        sourceType: 'field_report' as const,
        reportedBy: 'Tester',
        reportedAt: '2025-01-01T00:00:00.000Z',
        status: 'active' as const,
        needsReview: false,
        confidence: 0.9,
      },
    ];

    render(
      <AiSummary 
        articles={mockArticles} 
        fieldIncidents={mockFieldIncidents} 
        isLoadingNews={false} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Field report from Addis Ababa/)).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    const { getSummary } = await import('@/app/actions');
    (getSummary as any).mockResolvedValue({
      error: 'Failed to generate summary',
    });

    const mockArticles = [
      {
        id: '1',
        title: 'Test Article',
        source: 'Source',
        snippet: 'Snippet',
        url: 'https://test.com',
      },
    ];

    render(<AiSummary articles={mockArticles} isLoadingNews={false} />);

    await waitFor(() => {
      expect(screen.queryByText(/Test Article/)).not.toBeInTheDocument();
    });
  });
});
