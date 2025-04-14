
import React from 'react';
import { FilePreview as FilePreviewType } from '../types';
import FileUpload from './FileUpload';
import FilePreview from './FilePreview';

interface FileUploadSectionProps {
  selectedFiles: FilePreviewType[];
  isProcessing: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: (index: number) => void;
  onPreviewFile: (index: number) => void;
  onPrintRequest: () => void;
  getTotalPages: () => number;
  getTotalCost: () => number;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  selectedFiles,
  isProcessing,
  onFileSelect,
  onClearFile,
  onPreviewFile,
  onPrintRequest,
  getTotalPages,
  getTotalCost,
}) => {
  return (
    <>
      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Selected Files ({selectedFiles.length}/5)</h3>
            <p className="text-sm text-gray-600">
              Total: {getTotalPages()} pages • ₹{getTotalCost().toFixed(2)}
            </p>
          </div>
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="mb-4">
              <FilePreview 
                file={file}
                onClear={() => onClearFile(index)}
                onPreview={() => onPreviewFile(index)}
                onPrint={onPrintRequest}
                isProcessing={isProcessing}
              />
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={onPrintRequest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Print All Files'}
            </button>
          </div>
        </div>
      )}

      {/* Upload Section always visible to allow uploading after printing */}
      <FileUpload onFileSelect={onFileSelect} />
    </>
  );
};

export default FileUploadSection;
