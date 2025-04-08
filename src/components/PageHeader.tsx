
import React from 'react';
import { Printer } from 'lucide-react';
import { isMobileDevice } from './PrinterIntegration';

const PageHeader: React.FC = () => {
  return (
    <div className="bg-blue-600 p-6 text-white">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Printer className="w-8 h-8" />
        Print Smart Kiosk
        {isMobileDevice() && <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">Mobile</span>}
      </h1>
      <p className="mt-2 text-blue-100">
        Upload your documents and print them instantly
      </p>
    </div>
  );
};

export default PageHeader;
