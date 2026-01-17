import { useState } from "react";
import { Search, Mail, Phone, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { FilterChips } from "@/components/ui/FilterChips";

const departments = ["All", "Engineering", "Marketing", "Design", "Sales"];

const employees = {
  "Product Design": [
    {
      name: "Sarah Jenkins",
      role: "Senior Product Designer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Marcus Thorne",
      role: "UX Researcher",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
  ],
  "Engineering": [
    {
      name: "Elena Rodriguez",
      role: "Lead Frontend Engineer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "David Chen",
      role: "Senior Backend Dev",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Aisha Patel",
      role: "DevOps Specialist",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    },
  ],
};

const alphabetIndex = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "...", "M", "...", "S", "T", "...", "Z"];

export default function DirectoryPage() {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Company Directory" showBack />

      {/* Search Bar */}
      <div className="px-4 py-3 sticky top-[73px] bg-background/80 backdrop-blur-md z-20">
        <div className="flex w-full items-stretch rounded-xl h-12 card-shadow border border-border overflow-hidden">
          <div className="text-primary flex bg-card items-center justify-center pl-4">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl bg-card focus:outline-none focus:ring-0 border-none h-full placeholder:text-muted-foreground px-4 pl-2 text-base font-normal leading-normal"
            placeholder="Search employees, roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Department Filters */}
      <div className="px-4 py-2">
        <FilterChips options={departments} selected={filter} onSelect={setFilter} />
      </div>

      {/* Directory Content */}
      <div className="flex-1 pb-24 relative">
        {Object.entries(employees).map(([department, members]) => (
          <div key={department} className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-tight px-6 pb-3 pt-4 opacity-60">
              {department} — {members.length + 10}
            </h3>
            <div className="mx-4 flex flex-col gap-2">
              {members.map((employee) => (
                <div
                  key={employee.name}
                  className="flex items-center gap-4 bg-card px-4 min-h-[84px] py-3 justify-between rounded-xl card-shadow border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-14 w-14 rounded-full ring-2 ring-primary/10 bg-cover bg-center"
                      style={{ backgroundImage: `url(${employee.avatar})` }}
                    />
                    <div className="flex flex-col justify-center">
                      <p className="text-base font-bold leading-none mb-1">{employee.name}</p>
                      <p className="text-primary text-xs font-semibold uppercase tracking-wider">
                        {employee.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-primary/10 text-primary h-10 w-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <Mail className="h-5 w-5" />
                    </button>
                    <button className="bg-primary/10 text-primary h-10 w-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Alphabet Index */}
        <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-30">
          <div className="flex flex-col items-center bg-card/40 backdrop-blur-sm rounded-full py-2 px-1 border border-border">
            {alphabetIndex.map((letter, index) => (
              <span 
                key={index}
                className={`text-[10px] font-bold ${
                  ["A", "D", "E", "J", "M", "S"].includes(letter) 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center fab-shadow z-40 border-4 border-background">
        <Plus className="h-7 w-7" />
      </button>

      <BottomNav />
    </div>
  );
}
