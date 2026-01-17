import { Bell, ChevronLeft, HelpCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showAdd?: boolean;
  showHelp?: boolean;
  icon?: React.ReactNode;
  onAdd?: () => void;
}

export function AppHeader({ 
  title, 
  showBack = false, 
  showAdd = false, 
  showHelp = false,
  icon,
  onAdd 
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center p-4 justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center p-2 hover:bg-primary/10 rounded-full transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : icon ? (
            <div className="text-primary">{icon}</div>
          ) : null}
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {showHelp && (
            <button className="flex items-center justify-center p-2 hover:bg-primary/10 rounded-full transition-colors">
              <HelpCircle className="h-6 w-6 text-primary" />
            </button>
          )}
          {showAdd && (
            <button 
              onClick={onAdd}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
