
import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { appConfig } from '../config/appConfig';

interface FileUploadDropzoneProps {
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({ isUploading, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the file input to allow re-selecting the same file
    event.target.value = '';
    
    onFileSelect(file);
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isUploading ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-blue-500'
      }`}
      onClick={handleClick}
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
            PDF files up to {appConfig.maxFileSizeMB}MB (max {appConfig.maxFilesPerUser} files per session)
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

export default FileUploadDropzone;
