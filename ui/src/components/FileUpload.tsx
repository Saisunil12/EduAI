
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onFileUploaded?: (filePath: string, fileData: any) => void;
  className?: string;
}

export default function FileUpload({ onFilesSelected, onFileUploaded, className }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };
  
  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'txt', 'docx'].includes(extension || '');
    });
    
    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, TXT, and DOCX files are supported.",
        variant: "destructive"
      });
    }
    
    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesSelected?.(updatedFiles);
      
      toast({
        title: "Files added",
        description: `${validFiles.length} file(s) added successfully.`
      });
    }
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onFilesSelected?.(updatedFiles);
  };
  
  const uploadFiles = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload files",
        variant: "destructive"
      });
      return;
    }
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      for (const file of files) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('pdf_files')
          .upload(fileName, file);
          
        if (error) {
          throw error;
        }
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('pdf_files')
          .getPublicUrl(fileName);
        
        // Create a record in the notes table
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title: file.name,
            description: '',
            file_path: publicUrl,
            file_type: fileExtension || 'unknown',
            file_size: file.size
          })
          .select()
          .single();
        
        if (noteError) {
          throw noteError;
        }
        
        onFileUploaded?.(publicUrl, noteData);
      }
      
      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully`
      });
      
      setFiles([]);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="bg-secondary rounded-full p-3 mb-2">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Drag and drop files here</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Support for PDF, TXT, and DOCX files
          </p>
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Browse Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.txt,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Selected Files ({files.length})</h4>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li 
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-background/70 p-2 px-3 rounded-md text-sm"
                >
                  <div className="flex items-center gap-2">
                    <File size={16} className="text-primary" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(index)}
                  >
                    <X size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          
          <Button 
            onClick={uploadFiles} 
            disabled={uploading} 
            className="w-full"
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </>
      )}
    </div>
  );
}
