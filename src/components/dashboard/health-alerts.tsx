'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { healthAlerts } from '@/lib/mock-data';
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
import type { HealthAlert } from '@/lib/types';

const severityStyles = {
  High: 'bg-destructive/80 text-destructive-foreground border-destructive hover:bg-destructive/70',
  Medium: 'bg-yellow-500/80 text-black border-yellow-600 hover:bg-yellow-500/70',
  Low: 'bg-green-500/80 text-white border-green-600 hover:bg-green-500/70',
};

const HealthAlerts = () => {
  const [selectedAlert, setSelectedAlert] = useState<HealthAlert | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Health Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {healthAlerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all duration-200',
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
        </CardContent>
      </Card>

      <Dialog open={!!selectedAlert} onOpenChange={(isOpen) => !isOpen && setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title}</DialogTitle>
            <DialogDescription className="pt-2">
              <p className="mb-4">{selectedAlert?.details}</p>
              <Button asChild>
                <a href={selectedAlert?.link} target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HealthAlerts;
