import type { NewsArticle } from '@/lib/types';
import type { CategorizedArticle } from '@/ai/flows/categorize-news-articles-flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Brain, Target } from 'lucide-react';

interface NewsFeedProps {
  title: string;
  items: (NewsArticle | CategorizedArticle)[];
  icon: React.ReactNode;
  isLoading: boolean;
  error?: string | null;
}

// Type guard to check if an item is a CategorizedArticle
function isCategorizedArticle(item: NewsArticle | CategorizedArticle): item is CategorizedArticle {
  return 'category' in item && 'confidence' in item;
}

const NewsFeed = ({ title, items, icon, isLoading, error }: NewsFeedProps) => {
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-3 bg-secondary rounded-lg">
          <Skeleton className="h-5 w-4/5 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/4 mt-1" />
        </div>
      ))}
    </div>
  );
  
  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
      <AlertTriangle className="h-8 w-8 mb-2" />
      <p className="font-semibold">Failed to Load News</p>
      <p className="text-sm mt-1">{error}</p>
    </div>
  )

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingSkeleton();
    }
    if (error) {
      return renderError();
    }
    if (items.length > 0) {
      return (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="p-3 bg-secondary rounded-lg transition-all duration-300 hover:shadow-md animate-in fade-in-50">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{item.source}</p>
              <p className="text-sm">{item.snippet}</p>
              <Button variant="link" asChild className="p-0 h-auto mt-1">
                <a href={item.url} target="_blank" rel="noopener noreferrer">Read more</a>
              </Button>
              {isCategorizedArticle(item) && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-xs" variant={item.category === 'humanitarian' ? 'default' : 'secondary'}>
                      {item.category === 'humanitarian' ? 'Humanitarian' : 'General'}
                    </Badge>
                    <Badge className="text-xs" variant="outline">
                      <Brain className="h-3 w-3 mr-1" /> {Math.round(item.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Target className="inline h-3 w-3 mr-1" /> {item.reasoning}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )
    }
    return <p className="text-sm text-muted-foreground">No news articles available at this time.</p>;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {error ? <AlertTriangle className="h-5 w-5 text-destructive" /> : icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 sm:h-72">
          {renderContent()}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsFeed;
