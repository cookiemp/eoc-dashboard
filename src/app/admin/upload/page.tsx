'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, X, Info } from 'lucide-react';
import Link from 'next/link';

type ExtractedIncident = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  category: string;
  severity: string;
  color: string;
  affectedPeople?: number;
  confidence: number;
  needsReview: boolean;
};

type ProcessingResult = {
  success: true;
  fileName?: string;
  incidents: ExtractedIncident[];
  summary?: string;
  totalIncidentsFound: number;
  processingTimeMs?: number;
} | {
  success: false;
  error: string;
};

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(f => {
      if (f.type !== 'application/pdf') {
        alert(`${f.name} is not a PDF file`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        alert(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(f => {
      if (f.type !== 'application/pdf') {
        alert(`${f.name} is not a PDF file`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        alert(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setResult(null);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setStatusMessage(`Processing ${files.length} PDF(s)...`);

    try {
      const allIncidents: ExtractedIncident[] = [];
      let totalIncidentsFound = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressOffset = (i / files.length) * 100;
        const progressChunk = 100 / files.length;

        setProgress(progressOffset + progressChunk * 0.2);
        setStatusMessage(`Uploading ${file.name} (${i + 1}/${files.length})...`);

        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        });

        setProgress(progressOffset + progressChunk * 0.6);
        setStatusMessage(`AI analyzing ${file.name} (${i + 1}/${files.length})...`);

        const data = await response.json();

        if (response.ok && data.success && data.incidents) {
          allIncidents.push(...data.incidents);
          totalIncidentsFound += data.totalIncidentsFound || data.incidents.length;
        } else {
          console.error(`Failed to process ${file.name}:`, data.error);
        }

        setProgress(progressOffset + progressChunk);
      }

      setProgress(100);

      if (allIncidents.length > 0) {
        setStatusMessage(`Found ${totalIncidentsFound} incidents from ${files.length} file(s)!`);
        setResult({
          success: true,
          incidents: allIncidents,
          totalIncidentsFound,
          fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        });
      } else {
        setResult({
          success: false,
          error: 'No incidents found in any of the uploaded PDFs',
        });
        setStatusMessage('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      });
      setStatusMessage('');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!result || !result.success) return;

    try {
      const response = await fetch('/api/admin/publish-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidents: result.incidents,
          autoApprove,
          fileName: result.fileName,
        }),
      });

      if (response.ok) {
        alert(`Successfully published ${result.incidents.length} incidents to ${autoApprove ? 'dashboard' : 'review queue'}!`);
        // Reset form
        setFiles([]);
        setResult(null);
        setProgress(0);
      } else {
        const data = await response.json();
        alert(`Failed to publish: ${data.error}`);
      }
    } catch {
      alert('Failed to publish incidents');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Upload PDF Reports</h2>
        <p className="text-gray-600 mt-2">
          Upload ERCS field reports to extract incident data with AI
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Select PDF Files</CardTitle>
          <CardDescription>
            Upload one or more PDF field reports (max 5MB each)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              Drag and drop PDF files here
            </p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Browse Files
              </span>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {files.length} file(s) selected:
              </p>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="border rounded-lg p-3 flex items-center justify-between bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={processing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Auto-approve Toggle */}
          {files.length > 0 && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="auto-approve" className="text-base font-medium">
                  Auto-approve incidents
                </Label>
                <p className="text-sm text-gray-500">
                  Publish directly to dashboard without manual review
                </p>
              </div>
              <Switch
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
                disabled={processing}
              />
            </div>
          )}

          {/* Info Alert */}
          {!autoApprove && files.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Incidents will be sent to review queue for approval before appearing on dashboard
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          {files.length > 0 && !result && (
            <Button
              onClick={handleUpload}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract Incidents with AI
                </>
              )}
            </Button>
          )}

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-gray-600">{statusMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Extraction Complete
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Processing Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Successfully extracted <strong>{result.totalIncidentsFound} incidents</strong> from {result.fileName}
                    {result.processingTimeMs && (
                      <>
                        <br />
                        Processing time: {(result.processingTimeMs / 1000).toFixed(1)}s
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                {result.summary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Report Summary:</p>
                    <p className="text-sm text-gray-700">{result.summary}</p>
                  </div>
                )}

                {/* Incident List Preview */}
                <div>
                  <h3 className="font-semibold mb-3">Extracted Incidents:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.incidents.map((incident, index) => (
                      <div key={index} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium">{incident.title}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs mb-2">{incident.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>📍 {incident.locationName}</span>
                          <span>🏷️ {incident.category}</span>
                          <span>📊 {(incident.confidence * 100).toFixed(0)}% confidence</span>
                          {incident.needsReview && (
                            <span className="text-amber-600">⚠️ Needs review</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handlePublish} className="flex-1" size="lg">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {autoApprove ? 'Publish to Dashboard' : 'Send to Review Queue'}
                  </Button>
                  <Link href="/admin/pending" className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                      View Review Queue
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}