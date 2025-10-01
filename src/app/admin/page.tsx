'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    pendingReview: 0,
    recentUploads: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalIncidents: data.totalIncidents,
            pendingReview: data.pendingReview,
            recentUploads: data.recentUploads,
            loading: false,
          });
        } else {
          console.error('Failed to fetch stats');
          setStats(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    
    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Manage field reports and incident data
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Field Incidents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Active incidents from field reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Incidents awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Uploads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUploads}</div>
            <p className="text-xs text-muted-foreground">
              PDFs uploaded this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/upload">
            <Button className="w-full h-24 flex flex-col gap-2" size="lg">
              <Upload className="h-6 w-6" />
              <span>Upload PDF Report</span>
              <span className="text-xs font-normal opacity-80">
                Extract incidents from field reports
              </span>
            </Button>
          </Link>

          <Link href="/admin/pending">
            <Button 
              variant="outline" 
              className="w-full h-24 flex flex-col gap-2"
              size="lg"
            >
              <AlertCircle className="h-6 w-6" />
              <span>Review Pending</span>
              <span className="text-xs font-normal opacity-80">
                Approve incidents for dashboard
              </span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            How to use the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Upload PDF Field Report</h4>
              <p className="text-sm text-gray-600">
                Click &ldquo;Upload PDF Report&rdquo; and select a field report PDF. 
                The AI will automatically extract incident information.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Review Extracted Incidents</h4>
              <p className="text-sm text-gray-600">
                Check the AI-extracted incidents for accuracy. 
                You can edit details, remove incorrect incidents, or approve them.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Publish to Dashboard</h4>
              <p className="text-sm text-gray-600">
                Once approved, incidents will appear on the main dashboard map 
                for the operations team to see.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Auto-approve:</strong> Toggle this option during upload to 
              skip the review step and publish incidents directly to the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* View Main Dashboard Link */}
      <div className="flex justify-center">
        <Link href="/">
          <Button variant="outline" size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            View Main Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}