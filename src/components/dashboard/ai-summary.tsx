'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSummary } from '@/app/actions';
import type { SummarizeIncidentDataOutput } from '@/ai/flows/summarize-incident-data';
import type { NewsArticle } from '@/lib/types';
import type { FieldIncident } from '@/services/field-incidents-service';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface AiSummaryProps {
  articles: NewsArticle[];
  fieldIncidents?: FieldIncident[];
  isLoadingNews?: boolean;
  onIncidentFocus?: (incidentId: string) => void;
}

const AiSummary = ({ articles, fieldIncidents, isLoadingNews = false, onIncidentFocus }: AiSummaryProps) => {
  const [summary, setSummary] = useState<SummarizeIncidentDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasArticles, setHasArticles] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const generateSummary = async () => {
      // If news is still loading, keep showing loading state
      if (isLoadingNews) {
        setIsLoading(true);
        return;
      }
      
      if ((!articles || articles.length === 0) && (!fieldIncidents || fieldIncidents.length === 0)) {
        // Only set loading to false if news has finished loading
        setIsLoading(false);
        setHasArticles(false);
        return;
      }
      
      setHasArticles(true);
      try {
        const result = await getSummary({ articles, fieldIncidents });

        if ('error' in result) {
          toast({
            variant: 'destructive',
            title: 'Error Generating Summary',
            description: result.error,
          });
          setSummary(null);
        } else {
          setSummary(result);
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

    generateSummary();
  }, [articles, fieldIncidents, toast, isLoadingNews]);

  const renderSummary = () => {
    if (!summary) return null;

    // Split on line breaks first, then properly parse bullet points
    const lines = summary.summary.split('\n').filter(line => line.trim() !== '');
    const summaryPoints: Array<{text: string, isHealthAlert: boolean}> = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Check if line starts with bullet point markers
      if (trimmedLine.startsWith('⚕️*') || trimmedLine.startsWith('⚕️ *')) {
        // Health alert bullet point
        const text = trimmedLine.replace(/^⚕️\s*\*\s*/, '').trim();
        if (text) summaryPoints.push({ text, isHealthAlert: true });
      } else if (trimmedLine.startsWith('*')) {
        // Regular bullet point
        const text = trimmedLine.replace(/^\*\s*/, '').trim();
        if (text) summaryPoints.push({ text, isHealthAlert: false });
      } else if (trimmedLine.startsWith('⚕️') && trimmedLine.length > 2) {
        // Health alert without asterisk (only if there's text after emoji)
        const text = trimmedLine.replace(/^⚕️\s*/, '').trim();
        if (text) summaryPoints.push({ text, isHealthAlert: true });
      } else if (trimmedLine && !trimmedLine.includes(':') && trimmedLine !== '⚕️') {
        // Any other non-empty line that doesn't look like a header or standalone emoji
        summaryPoints.push({ text: trimmedLine, isHealthAlert: false });
      }
    }
    
    const healthAlerts = summaryPoints.some(point => point.isHealthAlert);

    return (
      <div className="space-y-4">
        {healthAlerts && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">Public health related alerts identified in the news feed.</p>
          </div>
        )}
        <ul className="space-y-2 list-none p-0">
          {summaryPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-primary mt-1">{point.isHealthAlert ? '⚕️' : '●'}</span>
              <span className="text-sm text-muted-foreground">
                {point.text.split(/(\[(?:Source|More)\]\(.*?\))/g).map((part, i) => {
                  // Match [Source](url) or [More](#id)
                  const sourceMatch = part.match(/\[Source\]\((.*?)\)/);
                  const moreMatch = part.match(/\[More\]\((#.*?)\)/);
                  
                  if (sourceMatch) {
                    return (
                      <a
                        key={i}
                        href={sourceMatch[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                      >
                        Source
                      </a>
                    );
                  } else if (moreMatch) {
                    const incidentId = moreMatch[1].substring(1); // Remove the # prefix
                    return (
                      <a
                        key={i}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onIncidentFocus) {
                            onIncidentFocus(incidentId);
                            // Scroll to map
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="text-primary underline hover:text-primary/80 cursor-pointer"
                      >
                        More
                      </a>
                    );
                  } else {
                    return <span key={i}>{part}</span>;
                  }
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle>AI-Powered Daily Briefing</CardTitle>
        </div>
        <CardDescription>An automated summary of the latest humanitarian news, updated daily. Health-related issues are highlighted with ⚕️.</CardDescription>
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
          <p className="text-sm text-muted-foreground">
            {hasArticles ? 'Generating summary...' : 'No summary available. Please check back later.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiSummary;
