
import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the file input to allow re-selecting the same file
    event.target.value = '';

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

    setIsUploading(true);
    
    try {
      // If user is logged in, upload to user's folder
      if (user) {
        // Upload to Supabase Storage directly here first
        const userId = user.id;
        const timestamp = new Date().getTime();
        const filePath = `${userId}/${timestamp}_${file.name}`;
        console.log(`Uploading to path: ${filePath}`);
        
        const { error: uploadError, data } = await supabase.storage
          .from('print_files')
          .upload(filePath, file, {
            upsert: true,
            cacheControl: '3600'
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
        
        // Get the file URL for the database
        const { data: fileUrlData } = supabase.storage
          .from('print_files')
          .getPublicUrl(filePath);
        
        console.log('File public URL:', fileUrlData.publicUrl);

        // Calculate pages (assuming calculatePages is available)
        let pageCount = 1;
        try {
          const { calculatePages } = await import('@/components/PageCalculator');
          pageCount = await calculatePages(file);
        } catch (pageError) {
          console.error('Error calculating pages:', pageError);
        }

        // Create a record in the files table
        const { error: fileRecordError, data: fileRecord } = await supabase
          .from('files')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_size: file.size,
            file_url: fileUrlData.publicUrl,
            page_count: pageCount,
            status: 'uploaded'
          })
          .select();

        if (fileRecordError) {
          console.error('Error creating file record:', fileRecordError);
          toast({
            title: "File record creation failed",
            description: fileRecordError.message,
            variant: "destructive"
          });
        } else {
          console.log('File record created successfully:', fileRecord);
          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been uploaded and saved`,
          });
        }
        
        // Create modified event object to pass to parent handler
        const modifiedEvent = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
        Object.defineProperty(modifiedEvent, 'target', {
          writable: false,
          value: { 
            files: [file],
            value: '' // Reset value to allow re-uploading same file
          }
        });
        
        // Now pass to the parent component handler
        onFileSelect(modifiedEvent as React.ChangeEvent<HTMLInputElement>);
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isUploading ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-blue-500'
      }`}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      {isUploading ? (
        <>
          <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Uploading...</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while your file uploads
          </p>
        </>
      ) : (
        <>
          <Upload className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Upload your file</h3>
          <p className="mt-2 text-sm text-gray-500">
            PDF files up to 10MB (max 50 pages)
          </p>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
};

export default FileUpload;
