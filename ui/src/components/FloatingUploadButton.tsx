
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FileUpload from './FileUpload';

export default function FloatingUploadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 rounded-full shadow-glow w-14 h-14 p-0"
        onClick={() => setIsOpen(true)}
      >
        <Upload size={24} />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Notes</DialogTitle>
          </DialogHeader>
          <FileUpload />
        </DialogContent>
      </Dialog>
    </>
  );
}
