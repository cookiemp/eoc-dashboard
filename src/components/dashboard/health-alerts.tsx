import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { healthAlerts } from '@/lib/mock-data';
import { AlertTriangle, Biohazard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const severityStyles = {
  High: 'bg-destructive/80 text-destructive-foreground border-destructive',
  Medium: 'bg-yellow-500/80 text-black border-yellow-600',
  Low: 'bg-green-500/80 text-white border-green-600',
};

const HealthAlerts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthAlerts.map((alert) => (
            <div key={alert.id} className={cn("p-4 rounded-lg border", severityStyles[alert.severity])}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{alert.title}</h3>
                    <Biohazard className="h-5 w-5" />
                </div>
                <p className="text-sm mb-2">Region: {alert.region}</p>
                <Badge variant="secondary" className="font-mono">Severity: {alert.severity}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthAlerts;
