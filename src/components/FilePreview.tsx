
import React from 'react';
import { FileText, X, Eye, CreditCard } from 'lucide-react';
import { FilePreview as FilePreviewType } from '../types';
import { formatFileSize, calculateCost } from './PageCalculator';

interface FilePreviewProps {
  file: FilePreviewType;
  onClear: () => void;
  onPreview: () => void;
  onPrint: () => void;
  isProcessing: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  onClear, 
  onPreview, 
  onPrint, 
  isProcessing 
}) => {
  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="font-medium text-gray-900">{file.name}</h3>
            <p className="text-sm text-gray-500">
              {formatFileSize(file.size)} • {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-5 h-5" />
          Preview
        </button>
        <button
          onClick={onPrint}
          disabled={isProcessing}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
            isProcessing ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          <CreditCard className="w-5 h-5" />
          Print and Pay (₹{calculateCost(file.pageCount)})
        </button>
      </div>
    </div>
  );
};

export default FilePreview;
