
import { File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface NoteCardProps {
  title: string;
  type: string;
  date: string;
  previewText?: string;
  className?: string;
  onView?: () => void;
  onAsk?: () => void;
  onSummarize?: () => void;
  onPodcast?: () => void;
}

export default function NoteCard({
  title,
  type,
  date,
  previewText,
  className,
  onView,
  onAsk,
  onSummarize,
  onPodcast
}: NoteCardProps) {
  return (
    <Card className={cn("hover-scale overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-secondary rounded-md">
              <File size={18} className="text-primary" />
            </div>
            <CardTitle className="text-base font-medium line-clamp-1">{title}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>}
              {onAsk && <DropdownMenuItem onClick={onAsk}>Ask AI</DropdownMenuItem>}
              {onSummarize && <DropdownMenuItem onClick={onSummarize}>Summarize</DropdownMenuItem>}
              {onPodcast && <DropdownMenuItem onClick={onPodcast}>Convert to Podcast</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{type}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </CardHeader>
      {previewText && (
        <CardContent className="pb-3 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{previewText}</p>
        </CardContent>
      )}
      <CardFooter className="pt-2 gap-2 flex">
        <Button size="sm" variant="outline" onClick={onAsk} className="flex-1">Ask</Button>
        <Button size="sm" variant="outline" onClick={onSummarize} className="flex-1">Summarize</Button>
      </CardFooter>
    </Card>
  );
}
