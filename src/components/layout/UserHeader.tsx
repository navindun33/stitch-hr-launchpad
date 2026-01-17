import { Bell } from "lucide-react";

interface UserHeaderProps {
  userName: string;
  greeting?: string;
  avatarUrl?: string;
}

export function UserHeader({ userName, greeting = "Good Morning", avatarUrl }: UserHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 pt-12 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
              <span className="text-amber-800 font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
            {greeting}
          </p>
          <h2 className="text-lg font-extrabold leading-tight">{userName}</h2>
        </div>
      </div>
      <button className="relative w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
        <Bell className="h-5 w-5" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
      </button>
    </div>
  );
}
