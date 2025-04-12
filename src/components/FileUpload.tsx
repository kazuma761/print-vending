
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size exceeds 10MB limit",
        variant: "destructive"
      });
      return;
    }

    // Log upload attempt for debugging
    console.log(`Attempting to upload file: ${file.name}, size: ${file.size} bytes`);

    try {
      // If user is logged in, upload to user's folder
      if (user) {
        // Upload to Supabase Storage directly here first
        const filePath = `${user.id}/${file.name}`;
        console.log(`Uploading to path: ${filePath}`);
        
        const { error: uploadError, data } = await supabase.storage
          .from('print_files')
          .upload(filePath, file, {
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading to storage:', uploadError);
          toast({
            title: "Upload failed",
            description: uploadError.message,
            variant: "destructive"
          });
          return;
        }

        console.log('File uploaded successfully to Storage:', data);
        
        // Now pass to the parent component handler
        onFileSelect(event);
      } else {
        console.log('No user logged in, using standard file select');
        // If not logged in, just use the standard file handler
        onFileSelect(event);
        
        toast({
          title: "Not logged in",
          description: "Please log in to save your files",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error in file upload process:', error);
      toast({
        title: "Upload error",
        description: "There was an error uploading your file",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="w-12 h-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Upload your file</h3>
      <p className="mt-2 text-sm text-gray-500">
        PDF files up to 10MB (max 50 pages)
      </p>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default FileUpload;
