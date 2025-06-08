import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import MiniPlayerButton from '@/components/MiniPlayerButton';
import SkeletonLoader from '@/components/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { File, Copy, Download, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

export default function Summarize() {
  const location = useLocation();
  const { toast } = useToast();
  const [selectedNote, setSelectedNote] = useState<string>(location.state?.noteId || '');
  const [format, setFormat] = useState<string>('bullet');
  const [length, setLength] = useState<string>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const handleGenerate = async () => {
    if (!selectedNote) {
      toast({
        title: 'Select a note',
        description: 'Please select a note to summarize',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setSummary(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/summarize_note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note_id: selectedNote,
          format,
          length,
        }),
      });
      if (!response.ok) throw new Error("Failed to summarize note");
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate summary.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast({
        title: 'Copied to clipboard',
        description: 'Summary has been copied to your clipboard.'
      });
    }
  };

  const downloadSummary = () => {
    if (summary) {
      const element = document.createElement('a');
      const file = new Blob([summary], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `summary-${selectedNote}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: 'Downloaded summary',
        description: 'Summary has been downloaded as a text file.'
      });
    }
  };

  const convertToAudio = () => {
    toast({
      title: 'Converting to audio',
      description: 'Your summary is being converted to audio format.'
    });

    // Simulate conversion
    setTimeout(() => {
      toast({
        title: 'Audio ready',
        description: 'Your summary has been converted to audio format.'
      });
    }, 2000);
  };

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="container py-8 px-4 max-w-5xl">
          <h1 className="text-3xl font-bold mb-2">Summarize Notes</h1>
          <p className="text-muted-foreground mb-8">Generate concise summaries of your study materials</p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Note</label>
                  <Select 
                    value={selectedNote || undefined} 
                    onValueChange={(value) => setSelectedNote(value || '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a note" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingNotes ? (
                        <SelectItem value="loading" disabled>Loading notes...</SelectItem>
                      ) : notes.length > 0 ? (
                        notes.map((note) => (
                          <SelectItem key={note.id} value={note.id}>
                            {note.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No notes available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullet">Bullet Points</SelectItem>
                      <SelectItem value="paragraph">Paragraphs</SelectItem>
                      <SelectItem value="tldr">TL;DR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Length</label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? 'Generating...' : 'Generate Summary'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-8">
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="original">Original Text</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                {isGenerating ? (
                  <Card>
                    <CardContent className="p-6">
                      <SkeletonLoader type="text" count={3} />
                    </CardContent>
                  </Card>
                ) : summary ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" size="sm" className="gap-2" onClick={copyToClipboard}>
                          <Copy size={16} /> Copy
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={downloadSummary}>
                          <Download size={16} /> Download
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={convertToAudio}>
                          <Play size={16} /> Convert to Audio
                        </Button>
                      </div>
                      <div className="prose prose-invert max-w-none bg-secondary/30 p-4 rounded-md">
                        <ReactMarkdown
                          components={{
                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          }}
                        >
                          {summary || ''}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="bg-secondary/30 rounded-full p-6 inline-flex mb-4">
                        <File size={32} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">No Summary Generated Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Select a note and generate a summary to see results
                      </p>
                      <Button onClick={handleGenerate} disabled={!selectedNote}>
                        Generate Summary
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="original" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <h3>Original Document</h3>
                      <p className="text-muted-foreground mb-4">This would display the original text content of the selected note.</p>
                      <div className="bg-secondary/30 p-4 rounded-md">
                        <p>
                          Cloud Computing Concept, Technology & Architecture - Unit 4: Virtualization of Clusters and Data Centers
                        </p>

                        <p>
                          Virtualization of Clusters and Data Centers can be implemented at various levels: instruction set architecture (ISA), hardware, operating system, library support, and application levels. Instruction set architecture level involves translating source ISA to the host machine's ISA for running legacy code. Hardware-abstraction level virtualization manages computer resources like processors and memory, improving hardware utilization by allowing multiple users to share the same hardware. Operating system level virtualization creates isolated containers on a single server, used for virtual hosting. Library support level virtualization handles application interaction with the system through API hooks, facilitating functionalities like GPU acceleration. Application level virtualization treats applications as virtual machines, similar to process-level virtualization.
                        </p>

                        <p>
                          Relative advantages of these approaches show that while hardware and OS support deliver high performance and are expensive, application-level virtualization offers flexibility and is easier to isolate applications. Different VM architectures, such as hypervisors and paravirtualization, facilitate virtualization. Xen architecture, an open-source hypervisor developed by Cambridge University, is a microkernel hypervisor that separates policy from mechanisms, with a small size and a focus on direct guest OS access to physical devices. Its core components include the hypervisor (Domain 0) and guest operating systems (Domain U), enabling efficient resource management and VM operations.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <FloatingUploadButton />
      <MiniPlayerButton />
    </div>
  );
}
