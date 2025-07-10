import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsFeedProps {
  title: string;
  items: NewsArticle[];
  icon: React.ReactNode;
  isLoading: boolean;
}

const NewsFeed = ({ title, items, icon, isLoading }: NewsFeedProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {isLoading ? (
            renderLoadingSkeleton()
          ) : items.length > 0 ? (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="p-3 bg-secondary rounded-lg transition-all duration-300 hover:shadow-md animate-in fade-in-50">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.source}</p>
                  <p className="text-sm">{item.snippet}</p>
                  <Button variant="link" asChild className="p-0 h-auto mt-1">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">Read more</a>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No news articles available at this time.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsFeed;
