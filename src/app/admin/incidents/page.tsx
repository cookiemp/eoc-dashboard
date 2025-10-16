'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Archive,
  AlertCircle
} from 'lucide-react';

type FieldIncident = {
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
  status: string;
};

export default function AllIncidentsPage() {
  const [incidents, setIncidents] = useState<FieldIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchAllIncidents();
  }, []);

  const fetchAllIncidents = async () => {
    try {
      const response = await fetch('/api/admin/all-incidents');
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents || []);
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (incidentId: string) => {
    if (!confirm('Archive this incident? It will be hidden from the dashboard.')) {
      return;
    }

    setProcessing(incidentId);
    try {
      const response = await fetch('/api/admin/archive-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });

      if (response.ok) {
        setIncidents(prev => 
          prev.map(i => i.id === incidentId ? { ...i, status: 'archived' } : i)
        );
      } else {
        alert('Failed to archive incident');
      }
    } catch {
      alert('Error archiving incident');
    } finally {
      setProcessing(null);
    }
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeIncidents = filteredIncidents.filter(i => i.status === 'active');
  const archivedIncidents = filteredIncidents.filter(i => i.status === 'archived');

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">All Incidents</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">All Field Incidents</h2>
        <p className="text-gray-600 mt-2">
          View and manage all field report incidents
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeIncidents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{archivedIncidents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search incidents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No incidents found</h3>
            <p className="text-gray-600 text-center">
              {searchQuery ? 'Try adjusting your search query' : 'No incidents have been uploaded yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Incidents */}
          {activeIncidents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Incidents ({activeIncidents.length})
              </h3>
              {activeIncidents.map((incident) => (
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
                          {incident.needsReview && (
                            <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                              Pending Review
                            </span>
                          )}
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

                    {/* Action */}
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        onClick={() => handleArchive(incident.id)}
                        disabled={processing === incident.id}
                        variant="outline"
                        size="sm"
                      >
                        {processing === incident.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Archived Incidents */}
          {archivedIncidents.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-gray-600">
                Archived Incidents ({archivedIncidents.length})
              </h3>
              {archivedIncidents.map((incident) => (
                <Card key={incident.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="flex items-center gap-2 text-gray-600">
                          {incident.title}
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            Archived
                          </span>
                        </CardTitle>
                        <CardDescription>
                          {incident.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{incident.locationName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(incident.reportedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}