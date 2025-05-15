
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BookOpenText, 
  MessageCircle, 
  FilePlus, 
  Headphones, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BookOpenText },
    { name: 'Ask AI', path: '/ask', icon: MessageCircle },
    { name: 'Summarize', path: '/summarize', icon: FilePlus },
    { name: 'Podcast', path: '/podcast', icon: Headphones },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col flex-1 py-6">
        <div className="px-4 mb-6 flex items-center justify-between">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-lg">EduNotes</span>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-full", collapsed && "mx-auto")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        
        <div className="px-3 mb-6">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className={cn(
                    "w-full gap-2 justify-center md:justify-start",
                    collapsed ? "px-2" : "px-4"
                  )}
                >
                  <Upload size={18} />
                  {!collapsed && <span>Upload Notes</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Upload Notes</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <TooltipProvider key={item.path} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent group",
                        isActive ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground",
                        collapsed ? "justify-center" : ""
                      )}
                    >
                      <item.icon size={20} className={cn(isActive ? "text-primary" : "", "transition-colors group-hover:text-primary")} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
