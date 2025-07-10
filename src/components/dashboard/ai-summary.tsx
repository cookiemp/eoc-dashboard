'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { getSummary } from '@/app/actions';
import type { SummarizeIncidentDataOutput } from '@/ai/flows/summarize-incident-data';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, MapPin, Users } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  incidentDetails: z.string().min(50, 'Please provide at least 50 characters for a meaningful summary.'),
});

const AiSummary = () => {
  const [summary, setSummary] = useState<SummarizeIncidentDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      incidentDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSummary(null);

    const result = await getSummary({ incidentDetails: values.incidentDetails });

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

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle>AI-Powered Summary</CardTitle>
        </div>
        <CardDescription>Summarize incident details from multiple sources for quick insights.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="incidentDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste incident reports, field notes, or any relevant text here..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Summary'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="mt-4">
        {isLoading ? (
          <div className="space-y-4 w-full">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-1/2" />
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-4 w-full animate-in fade-in-50 duration-500">
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">{summary.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Location</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{summary.location || "N/A"}</div>
                    </CardContent>
                </Card>
                <Card className="bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Casualties</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{summary.casualtyFigures || "N/A"}</div>
                    </CardContent>
                </Card>
            </div>
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default AiSummary;
