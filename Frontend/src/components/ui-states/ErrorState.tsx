import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center rounded-xl border border-red-100 bg-red-50/30">
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-zinc-600">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
