"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhoneCall, PlayCircle, Loader2, ListTree, User, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import Link from "next/link";
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

export default function CallsPage() {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalls = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const data = await fetchApi("/calls/");
      setCalls(data);
      if (error) setError(null);
    } catch (err: any) {
      if (!isPolling) setError(err.message || "Failed to load calls");
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadCalls();
    
    // Poll every 5 seconds for webhook updates
    const interval = setInterval(() => {
      loadCalls(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("completed") || s.includes("success")) return "bg-green-100 text-green-800 border-green-200";
    if (s.includes("failed") || s.includes("cancelled") || s.includes("error")) return "bg-red-100 text-red-800 border-red-200";
    if (s.includes("progress") || s.includes("ringing") || s.includes("initiated") || s.includes("queued")) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-zinc-100 text-zinc-800 border-zinc-200";
  };

  if (loading) return <LoadingState message="Loading call history..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadCalls()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Outreach Calls</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4 animate-pulse text-green-500" />
            Live tracking of AI agent conversations. Auto-updates every 5s.
          </p>
        </div>
      </div>

      {calls.length === 0 ? (
        <EmptyState 
          icon={<PhoneCall className="h-8 w-8" />}
          title="No calls initiated yet"
          description="Go to a Job's candidate search to start AI outreach."
        />
      ) : (
        <Card className="overflow-hidden shadow-sm animate-in fade-in">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">AI Analysis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call._id}>
                  <TableCell>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-zinc-400" />
                      {call.callee_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 pl-6">{call.mobile_number}</div>
                    <div className="text-xs text-zinc-400 pl-6 mt-0.5">{new Date(call.created_at).toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {call.job_title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(call.display_status)} capitalize font-semibold`}>
                      {call.display_status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {call.duration ? `${call.duration}s` : <span className="text-zinc-400 italic">Not Connected</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/calls/${call._id}`}>
                      <Button 
                        variant={call.structured_result ? "default" : "outline"} 
                        size="sm" 
                        className={call.structured_result ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-50"} 
                      >
                        <ListTree className="mr-2 h-4 w-4" />
                        View Full Details
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
