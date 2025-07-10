import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Newspaper } from 'lucide-react';

interface NewsFeedProps {
  title: string;
  items: NewsArticle[];
}

const NewsFeed = ({ title, items }: NewsFeedProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="p-3 bg-secondary rounded-lg transition-all duration-300 hover:shadow-md">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{item.source}</p>
                <p className="text-sm">{item.snippet}</p>
                <Button variant="link" asChild className="p-0 h-auto mt-1">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">Read more</a>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsFeed;
