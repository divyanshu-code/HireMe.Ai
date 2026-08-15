"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, PhoneCall, CheckCircle2, TrendingUp, AlertCircle, ArrowRight, UserCheck } from "lucide-react";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { EmptyState } from "@/components/ui-states/EmptyState";

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi("/dashboard/stats");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <LoadingState message="Crunching hiring metrics..." />;
  if (error || !data) return <ErrorState message={error || "Failed to load"} onRetry={loadDashboard} />;

  const { metrics, recent_activity } = data;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("completed") || s.includes("success")) return "bg-green-100 text-green-800 border-green-200";
    if (s.includes("failed") || s.includes("cancelled") || s.includes("error")) return "bg-red-100 text-red-800 border-red-200";
    if (s.includes("progress") || s.includes("ringing") || s.includes("initiated") || s.includes("queued")) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-muted text-foreground border-zinc-200";
  };

  const getResult = (structuredResult: any, key: string, defaultValue = "N/A") => {
    if (!structuredResult) return defaultValue;
    const value = structuredResult[key];
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your HireMe.Ai HR control center.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.total_jobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.total_candidates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Outreach</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{metrics.candidates_awaiting_outreach}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to be called</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified Talent</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{metrics.qualified_candidates}</div>
            <p className="text-xs text-muted-foreground mt-1">Passed AI Screening</p>
          </CardContent>
        </Card>
      </div>

      {/* Hiring Funnel */}
      <Card className="bg-zinc-950 text-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" /> Pipeline Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-0">
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="text-3xl font-bold text-white">{metrics.total_candidates}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Sourced</div>
            </div>
            <ArrowRight className="hidden md:block h-5 w-5 text-foreground" />
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="text-3xl font-bold text-white">{metrics.candidates_contacted}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Contacted</div>
            </div>
            <ArrowRight className="hidden md:block h-5 w-5 text-foreground" />
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="text-3xl font-bold text-white">{metrics.completed_calls}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Completed Calls</div>
            </div>
            <ArrowRight className="hidden md:block h-5 w-5 text-foreground" />
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="text-3xl font-bold text-white">{metrics.interested_candidates}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Interested</div>
            </div>
            <ArrowRight className="hidden md:block h-5 w-5 text-foreground" />
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="text-3xl font-bold text-green-400">{metrics.qualified_candidates}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Qualified</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Outreach */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Outreach</CardTitle>
          <Link href="/calls">
            <Button variant="outline" size="sm">View All Calls</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recent_activity.length === 0 ? (
            <div className="text-center py-8">
              <PhoneCall className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No recent outreach</p>
              <p className="text-sm text-muted-foreground mt-1">Start engaging candidates to see activity here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Qualified</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent_activity.map((call: any) => (
                    <TableRow key={call._id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{call.callee_name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(call.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell className="text-foreground">{call.job_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(call.display_status)} capitalize`}>
                          {call.display_status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.structured_result?.interested === true || call.structured_result?.interested === "Yes" ? (
                          <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Yes</span>
                        ) : (
                          <span className="text-muted-foreground">{getResult(call.structured_result, "interested")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {call.structured_result?.qualified === true || call.structured_result?.qualified === "Yes" ? (
                          <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Yes</span>
                        ) : (
                          <span className="text-muted-foreground">{getResult(call.structured_result, "qualified")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/calls/${call._id}`}>
                          <Button variant="ghost" size="sm" className="font-medium text-blue-600 hover:text-blue-800">
                            View Result
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
