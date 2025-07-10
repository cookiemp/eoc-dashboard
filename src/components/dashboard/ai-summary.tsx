'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSummary } from '@/app/actions';
import type { SummarizeIncidentDataOutput } from '@/ai/flows/summarize-incident-data';
import type { NewsArticle } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface AiSummaryProps {
  articles: NewsArticle[];
}

const AiSummary = ({ articles }: AiSummaryProps) => {
  const [summary, setSummary] = useState<SummarizeIncidentDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function generateSummary() {
      setIsLoading(true);
      const result = await getSummary({ articles });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error Generating Summary',
          description: result.error,
        });
      } else {
        setSummary(result);
      }
      setIsLoading(false);
    }

    if (articles.length > 0) {
      generateSummary();
    }
  }, [articles, toast]);

  const renderSummary = () => {
    if (!summary) return null;

    // Split the summary string into an array of bullet points
    const summaryPoints = summary.summary.split('*').filter(point => point.trim() !== '');

    return (
      <ul className="space-y-2 list-none p-0">
        {summaryPoints.map((point, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-primary mt-1">&#9679;</span>
            <span
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: point
                  .replace(/\[Source\]\((.*?)\)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">Source</a>')
              }}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle>AI-Powered Daily Briefing</CardTitle>
        </div>
        <CardDescription>An automated summary of the latest humanitarian news.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="space-y-4 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : summary ? (
          <div className="space-y-4 w-full animate-in fade-in-50 duration-500">
            {renderSummary()}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No summary available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiSummary;
