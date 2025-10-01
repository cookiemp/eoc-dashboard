'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  MapPin,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';

type PendingIncident = {
  id: string;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: string;
  color: string;
  confidence: number;
  affectedPeople?: number;
  reportedBy: string;
  reportedAt: string;
  needsReview: boolean;
};

export default function PendingReviewPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<PendingIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingIncidents();
  }, []);

  const fetchPendingIncidents = async () => {
    try {
      const response = await fetch('/api/admin/pending-incidents');
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (incidentId: string) => {
    setProcessing(incidentId);
    try {
      const response = await fetch('/api/admin/approve-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });

      if (response.ok) {
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
        // Force router to refresh so main dashboard will refetch data
        router.refresh();
      } else {
        alert('Failed to approve incident');
      }
    } catch (error) {
      alert('Error approving incident');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (incidentId: string) => {
    if (!confirm('Are you sure you want to delete this incident? This cannot be undone.')) {
      return;
    }

    setProcessing(incidentId);
    try {
      const response = await fetch('/api/admin/delete-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });

      if (response.ok) {
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
      } else {
        alert('Failed to delete incident');
      }
    } catch (error) {
      alert('Error deleting incident');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Pending Review</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Pending Review</h2>
        <p className="text-gray-600 mt-2">
          Review and approve incidents before they appear on the dashboard
        </p>
      </div>

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-gray-600 text-center">
              There are no incidents pending review at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {incidents.length} incident{incidents.length !== 1 ? 's' : ''} pending approval
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {incident.title}
                        <span className={`text-xs px-2 py-1 rounded ${
                          incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {incident.severity}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {incident.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{incident.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="capitalize">{incident.category}</span>
                    </div>
                    {incident.affectedPeople && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{incident.affectedPeople.toLocaleString()} affected</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(incident.reportedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Confidence and Coordinates */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                    <span>📊 Confidence: {(incident.confidence * 100).toFixed(0)}%</span>
                    <span>📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
                    <span>👤 Reported by: {incident.reportedBy}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleApprove(incident.id)}
                      disabled={processing === incident.id}
                      className="flex-1"
                      size="lg"
                    >
                      {processing === incident.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve & Publish
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(incident.id)}
                      disabled={processing === incident.id}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}