'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, ExternalLink, ChevronLeft, ChevronRight, Archive } from 'lucide-react';

type Article = {
  id: string;
  title: string;
  source: string;
  snippet: string;
  url: string;
  crawledAt: string;
};

function ArchivePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  useEffect(() => {
    const fetchArchivedNews = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('📋 Fetching archived news...', { currentPage, searchQuery });
        const response = await fetch(`/api/archived-news?page=${currentPage}&pageSize=10&search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        console.log('📊 Archive API response:', data);
        
        if (!data.success) {
          throw new Error(data.details || data.error || 'Failed to fetch archived news');
        }
        
        setArticles(data.articles || []);
        setTotalArticles(data.totalArticles || 0);
        setTotalPages(Math.ceil((data.totalArticles || 0) / (data.pageSize || 10)));
      } catch (error) {
        console.error('❌ Failed to fetch archived articles:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setArticles([]);
        setTotalArticles(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedNews();
  }, [currentPage, searchQuery]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Archive className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Archived News</h1>
            <a href="/" className="ml-auto text-sm text-muted-foreground hover:underline">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading articles...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error Loading Articles</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && (
          <>
            {articles.length > 0 ? (
              <>
                <div className="grid gap-4 mb-6">
                  {articles.map(article => (
                    <Card key={article.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 leading-tight">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {article.snippet}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(article.crawledAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary">{article.source}</Badge>
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            Read More <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Simple Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing page {currentPage} of {totalPages} ({totalArticles} total articles)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Articles Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? `No articles match "${searchQuery}"` : 'No archived articles available'}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ArchivePage;

