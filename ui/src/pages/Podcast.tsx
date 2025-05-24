import { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import SkeletonLoader from '@/components/SkeletonLoader';
import MiniPlayerButton from '@/components/MiniPlayerButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Headphones
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Note = {
  id: string;
  title: string;
};

type Podcast = {
  id: string;
  title: string;
  file_path: string;
  duration: number | null;
  created_at: string;
};

export default function Podcast() {
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState(location.state?.noteId || '');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [podcastGenerated, setPodcastGenerated] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('notes')
          .select('id, title')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setNotes(data || []);

        // If there's a noteId in the location state, set it as selected
        if (location.state?.noteId) {
          setSelectedNote(location.state.noteId);

          // Find the title of the selected note
          const selectedNoteData = data?.find(note => note.id === location.state?.noteId);
          if (selectedNoteData) {
            setTitle(selectedNoteData.title);
          }
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your notes',
          variant: 'destructive'
        });
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [user, location.state, toast]);

  // Check for existing podcast for the selected note
  useEffect(() => {
    const checkExistingPodcast = async () => {
      if (!user || !selectedNote) return;

      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .eq('note_id', selectedNote)
          .order('created_at', { ascending: false });

        if (error) {
          // Improved error logging
          console.error('Error checking for existing podcast:', error);
          toast({
            title: 'Error',
            description: error.message || JSON.stringify(error),
            variant: 'destructive'
          });
          return;
        }

        if (data && data.length > 0) {
          setPodcast(data[0]);
          setPodcastGenerated(true);
        } else {
          setPodcast(null);
          setPodcastGenerated(false);
        }
      } catch (error) {
        // Improved error logging for thrown exceptions
        if (error instanceof Error) {
          console.error('Error checking for existing podcast:', error.message);
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          console.error('Error checking for existing podcast:', error);
          toast({
            title: 'Error',
            description: JSON.stringify(error),
            variant: 'destructive'
          });
        }
      }
    };

    checkExistingPodcast();
  }, [selectedNote, user]);

  // Fetch signed URL when podcast is loaded
  useEffect(() => {
    const getSignedUrl = async () => {
      if (podcast && podcast.file_path) {
        let bucket = '';
        let filePath = '';
        if (podcast.file_path.startsWith('http')) {
          const match = podcast.file_path.match(/object\/public\/([^/]+)\/(.+)$/);
          if (match) {
            bucket = match[1];
            filePath = match[2];
          } else {
            setAudioUrl(null);
            return;
          }
        } else {
          // If file_path is just the storage path, set your bucket name here
          bucket = 'podcast_audio'; // <-- Change this to your actual bucket name
          filePath = podcast.file_path;
        }
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60);
        if (data?.signedUrl) {
          setAudioUrl(data.signedUrl);
          console.log('Signed audio URL:', data.signedUrl);
        } else {
          setAudioUrl(null);
          console.error('Error creating signed URL:', error);
        }
      } else {
        setAudioUrl(null);
      }
    };
    getSignedUrl();
  }, [podcast]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentTime = formatTime(progress);
  const totalTime = podcast?.duration ? formatTime(podcast.duration) : '10:22';

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to generate a podcast',
        variant: 'destructive'
      });
      return;
    }
    if (!selectedNote) {
      toast({
        title: 'Select a note',
        description: 'Please select a note to convert to podcast',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setPodcastGenerated(false);

    try {
      // Call your backend API
      const response = await fetch('/api/generate_podcast_from_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: selectedNote,
          user_id: user.id,
          title: title
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate podcast');
      }

      const data = await response.json();
      setPodcast(data.podcast); // Save podcast info to state
      setPodcastGenerated(true);
      setProgress(0);

      toast({
        title: 'Podcast generated',
        description: 'Your notes have been converted to audio format.'
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const downloadPodcast = () => {
    if (!podcast || !audioUrl) return;
    toast({
      title: 'Downloading podcast',
      description: 'Your podcast is being downloaded.'
    });
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${podcast.title || 'podcast'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      toast({
        title: 'Download complete',
        description: 'Your podcast has been downloaded successfully.'
      });
    }, 2000);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="container py-8 px-4 max-w-5xl">
          <h1 className="text-3xl font-bold mb-2">Convert to Podcast</h1>
          <p className="text-muted-foreground mb-8">Transform your notes into audio format for listening on the go</p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Podcast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Note</label>
                  <Select value={selectedNote} onValueChange={setSelectedNote}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a note" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingNotes ? (
                        <SelectItem value="loading" disabled>Loading notes...</SelectItem>
                      ) : notes.length > 0 ? (
                        notes.map((note) => (
                          <SelectItem key={note.id} value={note.id}>{note.title}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No notes available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title (Optional)</label>
                  <Input
                    placeholder="Custom title for your podcast"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedNote || loadingNotes}
                className="gap-2"
              >
                <Headphones size={18} />
                {podcastGenerated && podcast
                  ? (isGenerating ? 'Regenerating...' : 'Regenerate Podcast')
                  : (isGenerating ? 'Generating...' : 'Generate Podcast')}
              </Button>
            </CardFooter>
          </Card>

          {isGenerating ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="bg-primary/20 rounded-full p-6 mb-4">
                      <Headphones size={32} className="text-primary" />
                    </div>
                    <div className="h-4 bg-secondary w-48 rounded mb-2"></div>
                    <div className="h-3 bg-secondary w-36 rounded"></div>
                  </div>
                </div>
                <SkeletonLoader type="text" count={1} />
              </CardContent>
            </Card>
          ) : podcastGenerated && podcast ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-purple-900/30 p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-primary/20 rounded-full p-6">
                    <Headphones size={64} className="text-primary" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-1">
                      {podcast.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {podcast.duration ? formatTime(podcast.duration) : '10:22'} mins • Generated {new Date(podcast.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  {/* AUDIO PLAYER */}
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      style={{ display: 'none' }}
                      onTimeUpdate={e => setProgress((e.target as HTMLAudioElement).currentTime)}
                      onVolumeChange={e => setVolume((e.target as HTMLAudioElement).volume * 100)}
                      muted={isMuted}
                    />
                  )}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span>{currentTime}</span>
                        <span>{totalTime}</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-primary"
                          style={{ width: `${(progress / (podcast.duration || 622)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                          className="rounded-full"
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </Button>
                        <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${isMuted ? 0 : volume}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <SkipBack size={20} />
                        </Button>
                        <Button
                          size="icon"
                          className="h-12 w-12 rounded-full bg-primary"
                          onClick={togglePlay}
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <SkipForward size={20} />
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        className="rounded-full flex gap-2"
                        onClick={downloadPodcast}
                      >
                        <Download size={18} />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-secondary/30 rounded-full p-6 inline-flex mb-4">
                    <Headphones size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Podcast Generated Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Select a note and generate a podcast to start listening
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <FloatingUploadButton />
      {podcastGenerated && <MiniPlayerButton />}
    </div>
  );
}
