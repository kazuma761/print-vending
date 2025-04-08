
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="w-12 h-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Upload your file</h3>
      <p className="mt-2 text-sm text-gray-500">
        PDF, Word documents, and images up to 10MB (max 50 pages)
      </p>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
        onChange={onFileSelect}
      />
    </div>
  );
};

export default FileUpload;
