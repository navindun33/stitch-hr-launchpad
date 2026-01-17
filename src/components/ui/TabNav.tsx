import { cn } from "@/lib/utils";

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "flex flex-col items-center justify-center border-b-2 pb-3 pt-4 px-1 transition-colors",
            activeTab === tab
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-primary/70"
          )}
        >
          <p className="text-xs font-bold uppercase tracking-wider">{tab}</p>
        </button>
      ))}
    </div>
  );
}
