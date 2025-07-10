'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchHealthAlerts } from '@/app/actions';
import { Biohazard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { HealthAlert } from '@/lib/types';

const severityStyles = {
  High: 'bg-destructive/80 text-destructive-foreground border-destructive hover:bg-destructive/70',
  Medium: 'bg-yellow-500/80 text-black border-yellow-600 hover:bg-yellow-500/70',
  Low: 'bg-green-500/80 text-white border-green-600 hover:bg-green-500/70',
};

const HealthAlerts = () => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<HealthAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getAlerts = async () => {
      setIsLoading(true);
      const result = await fetchHealthAlerts();
      
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error Fetching Health Alerts',
          description: result.error,
        });
      } else {
        setAlerts(result.alerts);
      }
      setIsLoading(false);
    };
    getAlerts();
  }, [toast]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-lg border bg-muted">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Health Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeleton()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-lg',
                    severityStyles[alert.severity]
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{alert.title}</h3>
                    <Biohazard className="h-5 w-5" />
                  </div>
                  <p className="text-sm mb-2">Region: {alert.region}</p>
                  <Badge variant="secondary" className="font-mono">
                    Severity: {alert.severity}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAlert} onOpenChange={(isOpen) => !isOpen && setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title}</DialogTitle>
            <DialogDescription>
              {selectedAlert?.details}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button asChild>
              <a href={selectedAlert?.link} target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HealthAlerts;
