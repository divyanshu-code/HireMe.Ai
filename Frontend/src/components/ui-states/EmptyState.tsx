import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50">
      <div className="mb-4 rounded-full bg-zinc-100 p-4 text-zinc-500">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-500">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
