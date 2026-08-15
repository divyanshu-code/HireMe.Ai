"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Briefcase, Clock, Users, PhoneCall } from "lucide-react";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  experience: string;
  status: string;
  candidate_count: number;
  pipeline?: {
    discovered: number;
    enriched: number;
    called: number;
  };
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi(`/jobs/${id}`);
      setJob(data);
    } catch (err: any) {
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  if (loading) return <LoadingState message="Loading job details..." />;
  if (error || !job) return <ErrorState message={error || "Job not found"} onRetry={loadJob} />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{job.title}</h1>
            <Badge variant={job.status === "active" ? "default" : "secondary"}>
              {job.status}
            </Badge>
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location || "Not specified"}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.experience || "Not specified"}</span>
            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.requirements.length} Skills Required</span>
          </div>
        </div>
        <Link href={`/candidates/search?jobId=${job.id}`}>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            View Pipeline
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
                {job.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((req, i) => (
                  <Badge key={i} variant="secondary" className="bg-zinc-100 text-zinc-800">
                    {req}
                  </Badge>
                ))}
                {job.requirements.length === 0 && (
                  <span className="text-sm text-muted-foreground">No specific skills listed.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidate Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{job.pipeline?.discovered || 0}</div>
                      <div className="text-xs text-muted-foreground">Discovered</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-md">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">{job.pipeline?.enriched || 0}</div>
                      <div className="text-xs text-zinc-500">Enriched</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">{job.pipeline?.called || 0}</div>
                      <div className="text-xs text-zinc-500">Contacted</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
