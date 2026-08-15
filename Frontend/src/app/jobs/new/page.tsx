"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "", // Comma separated for simplicity
    location: "",
    experience: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.title || !formData.description) {
      setError("Title and description are required.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.split(",").map(r => r.trim()).filter(r => r),
      };

      await fetchApi("/jobs/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/jobs");
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (success) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12">
        <div className="rounded-full bg-green-100 p-3 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Job Created Successfully!</h2>
        <p className="text-muted-foreground">Redirecting to jobs board...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Job</h1>
          <p className="text-muted-foreground mt-1">Define the role and requirements to start sourcing.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-muted-foreground bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Title <span className="text-red-500">*</span></label>
              <input 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Engineer" 
                className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-zinc-950" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <input 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA or Remote" 
                  className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-zinc-950" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Experience Required</label>
                <input 
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 3-5 years" 
                  className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-zinc-950" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Required Skills</label>
              <input 
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="Comma separated (e.g. React, TypeScript, Node.js)" 
                className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-zinc-950" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Description <span className="text-red-500">*</span></label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Briefly describe the responsibilities..." 
                className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-zinc-950 resize-none" 
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
