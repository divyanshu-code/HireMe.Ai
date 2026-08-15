import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
