import Link from "next/link";
import { LayoutDashboard, Briefcase, PhoneCall } from "lucide-react";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-zinc-950 text-zinc-50">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <span className="text-xl font-bold tracking-tight">HireMe.Ai</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <Link onClick={onNavigate} href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>
        <Link onClick={onNavigate} href="/jobs" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
          <Briefcase className="h-5 w-5" />
          Jobs
        </Link>

        <Link onClick={onNavigate} href="/calls" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
          <PhoneCall className="h-5 w-5" />
          Calls
        </Link>
      </nav>
    </div>
  );
}
