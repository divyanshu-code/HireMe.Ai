"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, PhoneCall, Clock, PlayCircle, Calendar, DollarSign, Brain, CheckCircle2, XCircle } from "lucide-react";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";

interface CallData {
  _id: string;
  hunar_call_id: string;
  callee_name: string;
  mobile_number: string;
  display_status: string;
  duration?: number;
  recording_url?: string;
  structured_result?: Record<string, any>;
  created_at: string;
  job_title: string;
}

export default function CallDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCall = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi(`/calls/${id}`);
      setCall(data);
    } catch (err: any) {
      setError(err.message || "Failed to load call details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCall();
  }, [id]);

  if (loading) return <LoadingState message="Loading AI screening results..." />;
  if (error || !call) return <ErrorState message={error || "Call not found"} onRetry={loadCall} />;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("completed") || s.includes("success")) return "bg-green-100 text-green-800 border-green-200";
    if (s.includes("failed") || s.includes("cancelled") || s.includes("error")) return "bg-red-100 text-red-800 border-red-200";
    if (s.includes("progress") || s.includes("ringing") || s.includes("initiated") || s.includes("queued")) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-muted text-foreground border-zinc-200";
  };

  // Helper to safely get data
  const getResult = (key: string, defaultValue = "Not available") => {
    if (!call.structured_result) return defaultValue;
    const value = call.structured_result[key];
    if (value === undefined || value === null || value === "") return defaultValue;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const strVal = String(value).trim();
    if (strVal.toLowerCase() === "true") return "Yes";
    if (strVal.toLowerCase() === "false") return "No";
    return strVal;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link href="/calls">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{call.callee_name}</h1>
            <Badge variant="outline" className={`${getStatusColor(call.display_status)} capitalize font-semibold`}>
              {call.display_status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {call.job_title}</span>
            <span className="flex items-center gap-1"><PhoneCall className="h-4 w-4" /> {call.mobile_number}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(call.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Content: AI Screening Result */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-foreground" />
                AI Screening Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-y divide-zinc-100">
                {/* Interest & Qualification */}
                <div className="p-6 border-r border-zinc-100">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Interested in Role?</p>
                  <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                    {getResult("interested", "Not available") === "Yes" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : getResult("interested") === "No" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                    {getResult("interested")}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Qualified?</p>
                  <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                    {getResult("qualified", "Not available") === "Yes" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : getResult("qualified") === "No" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                    {getResult("qualified")}
                  </div>
                </div>

                {/* Experience & Skills */}
                <div className="p-6 border-r border-zinc-100 col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Relevant Experience</p>
                  <p className="text-foreground">{getResult("relevant_experience")}</p>
                </div>
                <div className="p-6 border-r border-zinc-100 col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Skills Match</p>
                  <p className="text-foreground">{getResult("skills_match")}</p>
                </div>

                {/* Logistics */}
                <div className="p-6 border-r border-zinc-100">
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Expected Salary
                  </p>
                  <p className="text-foreground font-medium">{getResult("expected_salary")}</p>
                </div>
                <div className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Notice Period
                  </p>
                  <p className="text-foreground font-medium">{getResult("notice_period")}</p>
                </div>
                <div className="p-6 col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Interview Availability</p>
                  <p className="text-foreground">{getResult("interview_availability")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary / Transcript summary */}
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">AI Call Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {getResult("recruiter_summary", "No summary provided by the AI agent.")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Call Analytics */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Call Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold text-foreground mt-1">{call.duration ? `${call.duration}s` : "Unknown"}</p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Call Recording</p>
                {call.recording_url ? (
                  <div className="space-y-3">
                    <audio controls className="w-full h-10">
                      <source src={call.recording_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <a href={call.recording_url} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-blue-600 hover:underline">
                      <PlayCircle className="h-4 w-4 mr-1" /> Open in new tab
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Recording not available.</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Call ID</p>
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 mt-1 break-all bg-zinc-100 dark:bg-zinc-800 p-2 rounded">{call.hunar_call_id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
