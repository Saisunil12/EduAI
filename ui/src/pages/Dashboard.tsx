
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import FileUpload from '@/components/FileUpload';
import NoteCard from '@/components/NoteCard';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Note = {
  id: string;
  title: string;
  file_type: string;
  created_at: string;
  description: string | null;
  file_path: string;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('recent');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setNotes(data || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your notes',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notes' }, 
        () => {
          fetchNotes();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleNoteAction = (noteId: string, action: 'view' | 'ask' | 'summarize' | 'podcast') => {
    switch (action) {
      case 'view':
        toast({
          title: 'Opening note',
          description: 'This would open the full note viewer.'
        });
        break;
      case 'ask':
        navigate('/ask', { state: { noteId } });
        break;
      case 'summarize':
        navigate('/summarize', { state: { noteId } });
        break;
      case 'podcast':
        navigate('/podcast', { state: { noteId } });
        break;
      default:
        break;
    }
  };

  const handleFileUploaded = () => {
    // Refresh will happen via realtime subscription
    toast({
      title: 'Note added',
      description: 'Your note has been added to your collection'
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="container py-8 px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Notes</h1>
              <p className="text-muted-foreground">Access and manage your educational materials</p>
            </div>
            <Button className="gap-2" onClick={() => document.getElementById('file-upload')?.click()}>
              Upload New Notes
            </Button>
          </div>
          
          <Tabs defaultValue="recent" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="recent">Recent Notes</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="all">All Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="mt-4">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.slice(0, 6).map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      type={note.file_type.toUpperCase()}
                      date={new Date(note.created_at).toLocaleDateString()}
                      previewText={note.description || 'No description available'}
                      onView={() => handleNoteAction(note.id, 'view')}
                      onAsk={() => handleNoteAction(note.id, 'ask')}
                      onSummarize={() => handleNoteAction(note.id, 'summarize')}
                      onPodcast={() => handleNoteAction(note.id, 'podcast')}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-secondary/30 rounded-full p-6 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">No notes yet</h3>
                  <p className="text-muted-foreground mb-6">Upload your first note to get started</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-secondary/30 rounded-full p-6 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">No favorite notes yet</h3>
                <p className="text-muted-foreground mb-6">Mark notes as favorite to see them here</p>
                <Button variant="outline" onClick={() => setActiveTab('recent')}>
                  View Recent Notes
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      type={note.file_type.toUpperCase()}
                      date={new Date(note.created_at).toLocaleDateString()}
                      previewText={note.description || 'No description available'}
                      onView={() => handleNoteAction(note.id, 'view')}
                      onAsk={() => handleNoteAction(note.id, 'ask')}
                      onSummarize={() => handleNoteAction(note.id, 'summarize')}
                      onPodcast={() => handleNoteAction(note.id, 'podcast')}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-secondary/30 rounded-full p-6 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">No notes yet</h3>
                  <p className="text-muted-foreground mb-6">Upload your first note to get started</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="bg-card border border-border/40 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload New Notes</h2>
            <FileUpload onFileUploaded={handleFileUploaded} />
          </div>
        </div>
      </div>
      <FloatingUploadButton />
    </div>
  );
}
