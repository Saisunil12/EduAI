import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ChatMessage from '@/components/ChatMessage';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import MiniPlayerButton from '@/components/MiniPlayerButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, ArrowDown, File, Book } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function AskAI() {
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Get noteId from location state if available
  const noteIdFromLocation = location.state?.noteId;

  // Fetch notes from Supabase
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, file_path, file_type')
        .order('created_at', { ascending: false });
      setNotes(data || []);
      setLoadingNotes(false);
    };
    fetchNotes();
  }, [user]);

  // Set initial selected note
  useEffect(() => {
    if (noteIdFromLocation) {
      setSelectedNoteId(noteIdFromLocation);
    } else if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id || '');
    }
  }, [noteIdFromLocation, notes, selectedNoteId]);

  // Update messages when selected note changes
  useEffect(() => {
    setMessages([]); // Clear messages when note changes
  }, [selectedNoteId]);

  const handleSelectNote = (value: string) => {
    setSelectedNoteId(value);
  };

  const getCurrentNoteName = () => {
    if (!selectedNoteId) return 'All Notes';
    const selectedNote = notes.find(note => note.id === selectedNoteId);
    return selectedNote ? selectedNote.title : 'Selected Note';
  };

  const handleSend = async () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive"
      });
      return;
    }

    if (!selectedNoteId) {
      toast({
        title: "Error",
        description: "Please select a note first",
        variant: "destructive"
      });
      return;
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      message: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Preparing chat request...');
      console.log('Note ID:', selectedNoteId);
      console.log('Question:', input);
      
      const payload = {
        note_id: selectedNoteId,
        question: input,
        history: updatedMessages
          .filter(m => m.type === 'user' || m.type === 'ai')
          .map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.message
          }))
      };
      
      console.log('Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.json().catch(err => {
        console.error('Error parsing response:', err);
        return {};
      });
      
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText, responseData);
        throw new Error(
          responseData.detail || 
          responseData.message || 
          `Error: ${response.status} ${response.statusText}`
        );
      }
      
      if (!responseData.answer) {
        throw new Error('Invalid response from server');
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai' as const,
        message: responseData.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: Array.isArray(responseData.sources) ? responseData.sources : []
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err: any) {
      console.error('Error in handleSend:', err);
      
      const errorMessage = err?.message || 'Failed to get AI response. Please try again.';
      
      // Add error message to chat
      const errorMessageObj = {
        id: Date.now() + 1,
        type: 'ai' as const,
        message: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessageObj]);
      
      // Show toast notification
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast({
        title: 'Recording stopped',
        description: 'Your voice input would be processed here.'
      });
    } else {
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Speak your question clearly...'
      });

      // Simulate recording stopping after 5 seconds
      setTimeout(() => {
        setIsRecording(false);
        setInput('What are the main concepts in chapter 3?');
        toast({
          title: 'Recording processed',
          description: 'Your question has been transcribed.'
        });
      }, 5000);
    }
  };

  const scrollToBottom = () => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <File size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-medium">Ask About Your Notes</h1>
              <p className="text-sm text-muted-foreground">
                Select a note and ask questions about its content
              </p>
            </div>
          </div>

          <div className="mt-4 max-w-sm">
            <Select value={selectedNoteId} onValueChange={handleSelectNote}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a note to chat about" />
              </SelectTrigger>
              <SelectContent>
                {loadingNotes ? (
                  <SelectItem value="loading" disabled>Loading notes...</SelectItem>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      <div className="flex items-center gap-2">
                        <Book size={16} />
                        <span>{note.title}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No notes available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32" id="chat-messages">
          <div className="max-w-4xl mx-auto">
            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  type={message.type}
                  message={message.message}
                  timestamp={message.timestamp}
                  sources={message.sources}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="mb-4 bg-primary/10 p-3 rounded-full">
                  <Book size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start a conversation about {getCurrentNoteName()}</h3>
                <p className="text-muted-foreground max-w-md">
                  Ask questions about the content of this note and get AI-powered answers with cited sources.
                </p>
              </div>
            )}

            {isLoading && (
              <ChatMessage
                type="ai"
                message="Thinking..."
                timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                isLoading={true}
              />
            )}
          </div>
        </div>

        {messages.length > 2 && (
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full absolute bottom-28 right-8 shadow-md"
            onClick={scrollToBottom}
          >
            <ArrowDown size={16} />
          </Button>
        )}

        <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm sticky bottom-0">
          <div className="max-w-4xl mx-auto relative">
            <Textarea
              placeholder={selectedNoteId ? `Ask a question about ${getCurrentNoteName()}...` : "Select a note first..."}
              className="min-h-24 pr-24 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !selectedNoteId}
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${isRecording ? 'text-red-500 bg-red-500/10' : ''}`}
                onClick={toggleRecording}
                disabled={isLoading || !selectedNoteId}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
              <Button
                className="rounded-full"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !selectedNoteId}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FloatingUploadButton />
      <MiniPlayerButton />
    </div>
  );
}
