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
    const generateAndCacheSummary = async () => {
      if (!articles || articles.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const result = await getSummary({ articles });

        if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Error Generating Summary',
            description: result.error,
          });
          setSummary(null);
        } else {
          setSummary(result);
          const today = new Date().toISOString().split('T')[0];
          const cache = { summary: result, date: today };
          localStorage.setItem('aiSummaryCache', JSON.stringify(cache));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
         toast({
            variant: 'destructive',
            title: 'Failed to Generate Summary',
            description: errorMessage,
          });
          setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    const loadSummary = () => {
      const today = new Date().toISOString().split('T')[0];
      const cachedItem = localStorage.getItem('aiSummaryCache');

      if (cachedItem) {
        try {
          const { summary: cachedSummary, date: cachedDate } = JSON.parse(cachedItem);
          if (cachedDate === today) {
            setSummary(cachedSummary);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // Cached item is invalid, proceed to fetch a new one
          console.error("Failed to parse cached summary:", error);
        }
      }
      
      // If no valid cache for today, generate a new one
      generateAndCacheSummary();
    };

    loadSummary();
  }, [articles, toast]);

  const renderSummary = () => {
    if (!summary) return null;

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
        <CardDescription>An automated summary of the latest humanitarian news, updated daily.</CardDescription>
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
          <p className="text-sm text-muted-foreground">No summary available. Please check back later.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiSummary;
