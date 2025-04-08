
import React from 'react';
import { Upload, Eye, Printer } from 'lucide-react';

const Instructions: React.FC = () => {
  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">How to print your documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Upload className="w-5 h-5" />
            <span className="font-medium">1. Upload</span>
          </div>
          <p className="text-sm text-gray-600">Select your file from your device</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Eye className="w-5 h-5" />
            <span className="font-medium">2. Preview</span>
          </div>
          <p className="text-sm text-gray-600">Review your document before printing</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Printer className="w-5 h-5" />
            <span className="font-medium">3. Print</span>
          </div>
          <p className="text-sm text-gray-600">Pay ₹4 per page and collect your printouts</p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
