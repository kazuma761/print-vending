
import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';
import { uploadFile, checkFileUploadLimit } from '../services/fileUploadService';
import FileUploadDropzone from './FileUploadDropzone';

interface FileUploadProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > appConfig.maxFileSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size exceeds ${appConfig.maxFileSizeMB}MB limit`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (!validateFile(file)) return;

    setIsUploading(true);
    
    try {
      if (user) {
        const canUpload = await checkFileUploadLimit(user.id);
        if (!canUpload) {
          toast({
            title: "File limit reached",
            description: `You can only upload ${appConfig.maxFilesPerUser} files per session. Please print your current files first.`,
            variant: "destructive"
          });
          return;
        }

        const result = await uploadFile(file, user.id);
        
        if (result.success) {
          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been uploaded and saved`,
          });
          
          const modifiedEvent = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
          Object.defineProperty(modifiedEvent, 'target', {
            writable: false,
            value: { 
              files: [file],
              value: ''
            }
          });
          
          onFileSelect(modifiedEvent);
        } else {
          toast({
            title: "Upload failed",
            description: result.error || "An unknown error occurred",
            variant: "destructive"
          });
        }
      } else {
        console.log('No user logged in, using standard file select');
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
    <>
      <FileUploadDropzone 
        isUploading={isUploading}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </>
  );
};

export default FileUpload;
