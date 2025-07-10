'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { generateIncidentDossier } from '@/app/actions';
import type { GenerateIncidentDossierOutput } from '@/ai/flows/generate-incident-dossier-flow';
import type { IncidentWithId } from '@/services/incident-service';
import { useToast } from '@/hooks/use-toast';
import { FileText, Image as ImageIcon } from 'lucide-react';

interface IncidentDossierDialogProps {
  incident: IncidentWithId;
  open: boolean;
  onClose: () => void;
}

const IncidentDossierDialog = ({ incident, open, onClose }: IncidentDossierDialogProps) => {
  const [dossier, setDossier] = useState<GenerateIncidentDossierOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch if the dialog is open and we don't already have data for this incident
    if (open && !dossier) {
      const fetchDossier = async () => {
        setIsLoading(true);
        try {
          const result = await generateIncidentDossier({
            title: incident.title,
            description: incident.description || 'No description provided.',
          });

          if (result.error) {
            toast({
              variant: 'destructive',
              title: 'Error Generating Dossier',
              description: result.error,
            });
            // Close the dialog on error to prevent it from being stuck in a loading state
            onClose(); 
          } else {
            setDossier(result);
          }
        } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
           toast({
            variant: 'destructive',
            title: 'Failed to Generate Dossier',
            description: errorMessage,
          });
           onClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchDossier();
    }
    
    // Reset state when dialog is closed
    if (!open) {
      setDossier(null);
      setIsLoading(false);
    }

  }, [open, incident, dossier, onClose, toast]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">{incident.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {incident.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          ) : dossier ? (
            <>
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  AI Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dossier.executiveSummary}
                </p>
              </div>
              <div>
                 <h3 className="flex items-center gap-2 font-semibold mb-2 text-foreground">
                   <ImageIcon className="h-5 w-5 text-primary" />
                   AI-Generated Photo
                 </h3>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                  <Image
                    src={dossier.photoDataUri}
                    alt={`AI-generated image for ${incident.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IncidentDossierDialog;
