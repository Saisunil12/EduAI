import { User, Bot, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

type MessageType = 'user' | 'ai';

interface Source {
  text: string;
  page?: number;
  document: string;
}

interface ChatMessageProps {
  type: MessageType;
  message: string;
  timestamp: string;
  sources?: Source[];
  isLoading?: boolean;
}

export default function ChatMessage({
  type,
  message,
  timestamp,
  sources,
  isLoading,
  isError
}: ChatMessageProps & { isError?: boolean }) {
  return (
    <div className={cn(
      "flex gap-4 mb-6",
      type === 'user' ? 'flex-row' : 'flex-row'
    )}>
      <div className={cn(
        "flex items-center justify-center h-10 w-10 rounded-full shrink-0",
        type === 'user' ? 'bg-secondary' : isError ? 'bg-destructive/20' : 'bg-primary/20'
      )}>
        {type === 'user' ? (
          <User size={20} className="text-primary" />
        ) : isError ? (
          <AlertTriangle size={20} className="text-destructive" />
        ) : (
          <Bot size={20} className="text-primary" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("font-medium", isError && 'text-destructive')}>
            {type === 'user' ? 'You' : isError ? 'Error' : 'AI Assistant'}
          </div>
          <div className="text-xs text-muted-foreground">
            {timestamp}
          </div>
        </div>

        <Card className={cn(
          "p-4 text-sm leading-relaxed",
          isLoading && "animate-pulse",
          isError ? 'border-destructive/30 bg-destructive/5' : ''
        )}>
          <div className={cn("mb-3", isError && 'text-destructive')}>
            {type === 'ai' || isError ? (
              <ReactMarkdown
                components={{
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                  a: ({ node, ...props }) => <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-secondary px-1 rounded text-sm" {...props} />,
                  pre: ({ node, ...props }) => <pre className="bg-secondary p-2 rounded overflow-x-auto my-2" {...props} />,
                }}
              >{message}</ReactMarkdown>
            ) : (
              message
            )}
          </div>

          {!isError && sources && sources.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Sources:</h4>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="bg-secondary/50 p-2 rounded-md text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{source.document}</span>
                      {source.page && <span className="text-muted-foreground">Page {source.page}</span>}
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{source.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
