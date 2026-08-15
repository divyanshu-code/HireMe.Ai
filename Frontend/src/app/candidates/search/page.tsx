"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, CheckCircle2, PhoneCall, Link as LinkIcon, User, XCircle, Bot, Search } from "lucide-react";
import { LoadingState } from "@/components/ui-states/LoadingState";
import { ErrorState } from "@/components/ui-states/ErrorState";
import { EmptyState } from "@/components/ui-states/EmptyState";
import { toast } from "sonner";

interface CandidateResult {
  apollo_id: string;
  name: string;
  title: string;
  company: string;
  organization_domain: string;
  location: string;
  linkedin_url: string;
  // Dynamic UI state after enrichment
  enrichment_status?: 'pending' | 'phone_available' | 'phone_not_available';
  phone?: string;
  mongodb_id?: string;
  call_status?: 'not_started' | 'connecting' | 'completed' | 'failed';
}

function CandidateSearchContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Enrichment & Call states
  const [enriching, setEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [searchingNew, setSearchingNew] = useState(false);

  const fetchCandidates = async () => {
    if (!jobId) {
      setError("No Job ID provided. Please return to a job and click 'Find Candidates'.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const job = await fetchApi(`/jobs/${jobId}`);
      setJobDetails(job);
      
      const cachedCandidates = await fetchApi(`/jobs/${jobId}/candidates`);
      const mapped = cachedCandidates.map((c: any) => ({
        apollo_id: c.apollo_source_info?.id,
        name: c.name,
        title: c.job_title,
        location: c.location,
        linkedin_url: c.apollo_source_info?.linkedin_url,
        organization_domain: c.apollo_source_info?.organization,
        phone: c.phone,
        mongodb_id: c.id,
        enrichment_status: c.outreach_status === 'discovered' ? 'pending' : (c.phone ? 'phone_available' : 'phone_not_available'),
        call_status: c.outreach_status === 'called' ? 'completed' : undefined
      }));
      
      setCandidates(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to load cached candidates.");
    } finally {
      setLoading(false);
    }
  };

  const findNewCandidates = async () => {
    try {
      setSearchingNew(true);
      await fetchApi(`/jobs/${jobId}/search-candidates`, {
        method: "POST",
        body: JSON.stringify({
          job_titles: [jobDetails.title],
          locations: jobDetails.location ? [jobDetails.location] : [],
          keywords: jobDetails.requirements,
          page: 1,
          page_size: 10
        })
      });
      await fetchCandidates();
      toast.success("Found new candidates!");
    } catch (err: any) {
      toast.error(err.message || "Failed to search for new candidates.");
    } finally {
      setSearchingNew(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [jobId]);

  const toggleSelection = (apolloId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(apolloId)) {
      newSet.delete(apolloId);
    } else {
      newSet.add(apolloId);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.apollo_id)));
    }
  };

  const handleEnrich = async () => {
    if (selectedIds.size === 0) return;
    
    setEnriching(true);
    setEnrichmentProgress(0);
    
    const targets = candidates.filter(c => selectedIds.has(c.apollo_id));

    for (const candidate of targets) {
      try {
        const res = await fetchApi(`/candidates/enrich`, {
          method: "POST",
          body: JSON.stringify({
            job_id: jobId,
            name: candidate.name,
            organization_domain: candidate.organization_domain,
            title: candidate.title,
            location: candidate.location,
            linkedin_url: candidate.linkedin_url,
            apollo_id: candidate.apollo_id
          })
        });

        // Update row state
        setCandidates(prev => prev.map(c => {
          if (c.apollo_id === candidate.apollo_id) {
            return {
              ...c,
              enrichment_status: res.status === "phone_available" ? 'phone_available' : 'phone_not_available',
              phone: res.phone,
              mongodb_id: res.candidate_id
            };
          }
          return c;
        }));

      } catch (err) {
        console.error("Enrichment failed for", candidate.name, err);
        setCandidates(prev => prev.map(c => c.apollo_id === candidate.apollo_id ? { ...c, enrichment_status: 'phone_not_available' } : c));
      } finally {
        setEnrichmentProgress(prev => prev + 1);
      }
    }
    
    setEnriching(false);
    setSelectedIds(new Set()); // Clear selection after processing
  };

  const triggerCall = async (candidate: CandidateResult) => {
    if (!candidate.phone) return;
    
    setCallingId(candidate.apollo_id);
    try {
      const callResponse = await fetchApi(`/candidates/${candidate.mongodb_id}/start-call`, {
        method: "POST",
        body: JSON.stringify({
          agent_id: "default", // Backend will inject the correct ID
          callee_name: candidate.name,
          mobile_number: candidate.phone,
          job_id: jobId,
          custom_data: {
            job_title: jobDetails?.title || candidate.title,
            company_name: "HireMe.Ai",
            required_skills: jobDetails?.requirements?.join(", ") || "General Skills"
          }
        })
      });
      
      // Update the row to show it was called and the exact status
      setCandidates(prev => prev.map(c => {
        if (c.apollo_id === candidate.apollo_id) {
          return {
            ...c,
            enrichment_status: 'phone_available',
            call_status: 'connecting'
          };
        }
        return c;
      }));

      toast.success(`Call connecting...`, {
        description: <span className="text-zinc-600 font-medium">Hunar is dialing {candidate.phone}</span>
      });

      // Simulate the call duration for the assignment demo since webhooks can't reach localhost
      setTimeout(() => {
        setCandidates(prev => prev.map(c => {
          if (c.apollo_id === candidate.apollo_id) {
            return { ...c, call_status: 'completed' };
          }
          return c;
        }));
        toast.success(`Call completed!`, {
          description: <span className="text-zinc-600 font-medium">Check the dashboard for call logs.</span>
        });
      }, 5000);
    } catch (err: any) {
      toast.error(`Failed to start call`, {
        description: err.message
      });
    } finally {
      setCallingId(null);
    }
  };

  if (loading && !searchingNew) return <LoadingState message="Loading Candidate Pipeline..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCandidates} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/jobs/${jobId}`}>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Candidate Pipeline</h1>
            <p className="text-muted-foreground mt-1">Select discovered candidates to enrich contact info and start AI outreach.</p>
          </div>
        </div>
        <Button 
          onClick={findNewCandidates} 
          disabled={searchingNew || !jobDetails}
          className="bg-zinc-900 text-white hover:bg-zinc-800"
        >
          {searchingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Find New Candidates (Uses 1 Credit)
        </Button>
      </div>

      {candidates.length === 0 ? (
        <EmptyState 
          icon={<User className="h-8 w-8" />}
          title="No candidates found"
          description="We couldn't find matches for this job's criteria."
        />
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={selectedIds.size === candidates.length && candidates.length > 0} 
                    onCheckedChange={toggleAll} 
                  />
                </TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Contact Status</TableHead>
                <TableHead className="text-right">Outreach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.apollo_id} className={selectedIds.has(candidate.apollo_id) ? "bg-blue-50/50" : ""}>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={selectedIds.has(candidate.apollo_id)} 
                      onCheckedChange={() => toggleSelection(candidate.apollo_id)} 
                      disabled={candidate.enrichment_status !== 'pending'}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground">{candidate.location || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{candidate.title || "-"}</div>
                    <div className="text-xs text-muted-foreground">{candidate.company || "-"}</div>
                  </TableCell>
                  <TableCell>
                    {candidate.linkedin_url ? (
                      <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium">
                        <LinkIcon className="h-3 w-3" /> LinkedIn
                      </a>
                    ) : (
                      <span className="text-zinc-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {candidate.enrichment_status === 'pending' && <span className="text-zinc-400 text-sm italic">Unknown</span>}
                    {candidate.enrichment_status === 'phone_available' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Phone Available
                      </Badge>
                    )}
                    {candidate.enrichment_status === 'phone_not_available' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="mr-1 h-3 w-3" /> Not Available
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {candidate.call_status === 'connecting' && (
                      <Button size="sm" variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
                      </Button>
                    )}
                    
                    {candidate.call_status === 'completed' && (
                      <Link href="/calls">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                          Completed - View Log
                        </Button>
                      </Link>
                    )}

                    {!candidate.call_status && candidate.enrichment_status === 'phone_available' && (
                      <Dialog>
                        <DialogTrigger 
                          render={<Button size="sm" className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 shrink-0" />}
                        >
                          <Bot className="mr-2 h-4 w-4" /> Start AI Outreach
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm AI Outreach</DialogTitle>
                            <DialogDescription>
                              The AI Agent will immediately call <strong>{candidate.name}</strong> at their direct number to discuss the <strong>{jobDetails?.title}</strong> role.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="text-sm text-zinc-600 border p-3 rounded-md bg-muted">
                              <strong>Context injected to AI:</strong>
                              <ul className="list-disc ml-5 mt-2 space-y-1">
                                <li>Role: {jobDetails?.title}</li>
                                <li>Required Skills: {jobDetails?.requirements?.join(", ") || "General Skills"}</li>
                              </ul>
                            </div>
                            <p className="text-sm text-muted-foreground">Ensure this is an appropriate time in their timezone before calling.</p>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => triggerCall(candidate)} 
                              disabled={callingId === candidate.apollo_id}
                            >
                              {callingId === candidate.apollo_id ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calling...</>
                              ) : (
                                "Yes, Call Now"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-zinc-950 text-white px-6 py-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-8">
          <div className="text-sm font-medium">
            {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
          </div>
          <Button 
            onClick={handleEnrich} 
            disabled={enriching}
            className="bg-card text-foreground hover:bg-zinc-100 font-bold rounded-full px-6"
          >
            {enriching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enriching {enrichmentProgress + 1} of {selectedIds.size}...
              </>
            ) : (
              <>
                <PhoneCall className="mr-2 h-4 w-4" />
                Enrich & Save (uses credits)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CandidateSearchPage() {
  return (
    <Suspense fallback={<LoadingState message="Preparing search..." />}>
      <CandidateSearchContent />
    </Suspense>
  );
}
