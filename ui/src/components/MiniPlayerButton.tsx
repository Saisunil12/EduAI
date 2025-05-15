
import { useState } from 'react';
import { Play, Pause, X, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function MiniPlayerButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(
        "fixed transition-all duration-300 bg-card shadow-lg border border-border rounded-full",
        isExpanded 
          ? "bottom-6 left-6 right-6 sm:left-auto sm:w-80 h-16" 
          : "bottom-6 left-6 w-14 h-14"
      )}
    >
      {isExpanded ? (
        <div className="flex items-center gap-3 px-4 h-full">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full shrink-0 text-primary" 
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Introduction to Machine Learning</div>
            <Slider
              value={[progress]} 
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setProgress(value[0])}
              className="h-1 my-1"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1:23</span>
              <span>4:56</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full shrink-0"
            onClick={toggleExpand}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-full w-full rounded-full p-0 text-primary"
          onClick={toggleExpand}
        >
          <Headphones size={24} />
        </Button>
      )}
    </div>
  );
}
