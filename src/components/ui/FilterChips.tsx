import { cn } from "@/lib/utils";

interface FilterChipsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium shrink-0 transition-all",
            selected === option
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
