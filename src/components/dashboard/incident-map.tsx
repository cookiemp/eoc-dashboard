import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { incidents } from '@/lib/mock-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin } from 'lucide-react';

const IncidentMap = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Incident Map</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden">
            <Image
              src="https://placehold.co/1600x900.png"
              alt="Map of Ethiopia"
              layout="fill"
              objectFit="cover"
              className="opacity-70"
              data-ai-hint="map ethiopia"
            />
            {incidents.map((incident) => (
              <Tooltip key={incident.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: incident.top, left: incident.left }}
                  >
                    <div className="relative">
                      <div className={`absolute h-4 w-4 rounded-full ${incident.color} animate-ping opacity-75`}></div>
                      <div className={`relative block h-4 w-4 rounded-full ${incident.color} border-2 border-white shadow-md`}></div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{incident.title}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default IncidentMap;
