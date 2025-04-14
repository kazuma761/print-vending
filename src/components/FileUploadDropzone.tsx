
import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadDropzoneProps {
  isUploading: boolean;
  onClick: () => void;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  isUploading,
  onClick
}) => {
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isUploading ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-blue-500'
      }`}
      onClick={onClick}
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
            PDF files up to 10MB (max {appConfig.maxFilesPerUser} files per session)
          </p>
        </>
      )}
    </div>
  );
};

export default FileUploadDropzone;
