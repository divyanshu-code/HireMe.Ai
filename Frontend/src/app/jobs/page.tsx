"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase } from "lucide-react";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { EmptyState } from "@/components/ui-states/EmptyState";

interface Job {
  id: string;
  title: string;
  location: string;
  experience: string;
  status: string;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi("/jobs/");
      setJobs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  if (loading) return <LoadingState message="Loading jobs..." />;
  if (error) return <ErrorState message={error} onRetry={loadJobs} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-2">Manage your open positions and hiring pipelines.</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState 
          icon={<Briefcase className="h-8 w-8" />}
          title="No jobs found"
          description="Get started by creating your first job posting."
          action={
            <Link href="/jobs/new">
              <Button variant="outline">Create Job</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.location}</TableCell>
                  <TableCell className="text-muted-foreground">{job.experience}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm" className="font-semibold text-zinc-600 hover:text-foreground">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
