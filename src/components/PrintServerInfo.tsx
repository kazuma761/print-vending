
import React from 'react';
import { Info, Printer, Laptop, Link2 } from 'lucide-react';
import { getPrintServerUrl, isMobileDevice } from './PrinterIntegration';

const PrintServerInfo: React.FC = () => {
  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-medium flex items-center gap-2 text-blue-700">
        <Info className="w-5 h-5" />
        How Remote Printing Works
      </h3>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-blue-100 p-2 rounded-full">
            <Printer className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <p className="text-blue-800">
              {isMobileDevice() 
                ? "You're printing from a mobile device. Your files will be sent to the print server."
                : "You're printing from a desktop. Files will be printed directly or through the server as needed."}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-blue-100 p-2 rounded-full">
            <Link2 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <p className="text-blue-800">
              Print Server: <span className="font-mono bg-blue-100 px-1 rounded">{getPrintServerUrl()}</span>
            </p>
            <p className="text-sm text-blue-600 mt-1">
              This server receives your files and makes them available to the printer.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-blue-100 p-2 rounded-full">
            <Laptop className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <p className="text-blue-800">
              A client application running on the printer-connected computer will pick up your print jobs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintServerInfo;
