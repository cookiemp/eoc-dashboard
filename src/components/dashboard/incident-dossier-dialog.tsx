'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { generateIncidentDossier } from '@/app/actions';
import type { GenerateIncidentDossierOutput } from '@/ai/flows/generate-incident-dossier-flow';
import type { IncidentWithId } from '@/services/incident-service';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{incident.title}</DialogTitle>
          <DialogDescription>
            {incident.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-16 w-full" />
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
            </>
          ) : null}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentDossierDialog;
