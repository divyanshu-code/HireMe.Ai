import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 bg-white dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex items-center md:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-zinc-500">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-2 font-bold text-foreground">HireMe.Ai</span>
      </div>
      
      {/* Spacer for desktop to keep items on right */}
      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="text-zinc-500">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
