import { cn } from "@/lib/utils";

interface YearTabsProps {
  years: string[];
  selected: string;
  onSelect: (year: string) => void;
}

export function YearTabs({ years, selected, onSelect }: YearTabsProps) {
  return (
    <div className="flex bg-card p-1 rounded-xl border border-border">
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onSelect(year)}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            selected === year
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-primary"
          )}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
