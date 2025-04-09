
import React from 'react';
import { Printer, Server } from 'lucide-react';
import { isMobileDevice, getPrintServerUrl } from './PrinterIntegration';

const PageHeader: React.FC = () => {
  return (
    <div className="bg-blue-600 p-6 text-white">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Printer className="w-8 h-8" />
        Printer Smart 
        {isMobileDevice() && <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">Mobile</span>}
        <span className="text-xs bg-green-500 px-2 py-1 rounded-full flex items-center gap-1">
          <Server className="w-3 h-3" />
          Connected
        </span>
      </h1>
      <p className="mt-2 text-blue-100">
        Upload your documents and print them instantly
      </p>
      <p className="mt-1 text-xs text-blue-200 flex items-center gap-1">
        <Server className="w-3 h-3" />
        Server: {getPrintServerUrl()}
      </p>
    </div>
  );
};

export default PageHeader;
