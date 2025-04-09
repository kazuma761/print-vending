
import React, { useState, useEffect } from 'react';
import { getPrintServerUrl, setPrintServerUrl, checkServerConnection } from './PrinterIntegration';
import { AlertCircle, Server, CheckCircle } from 'lucide-react';

const PrintServerConfig: React.FC = () => {
  const [serverUrl, setServerUrl] = useState<string>(getPrintServerUrl());
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  
  useEffect(() => {
    // Check connection status when component mounts
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    setIsChecking(true);
    const connected = await checkServerConnection();
    setIsConnected(connected);
    setIsChecking(false);
  };
  
  const handleSaveServerUrl = () => {
    setPrintServerUrl(serverUrl);
    checkConnection();
  };
  
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Server className="w-5 h-5" />
        Print Server Configuration
      </h3>
      
      <div className="mt-4">
        <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700">
          Print Server URL
        </label>
        <div className="mt-1 flex">
          <input
            type="text"
            id="serverUrl"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://your-print-server.com"
          />
          <button
            onClick={handleSaveServerUrl}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center">
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center gap-2"
        >
          {isChecking ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
          ) : (
            <span>Check Connection</span>
          )}
        </button>
        
        {isConnected !== null && !isChecking && (
          <div className={`ml-4 flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Connected successfully</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Failed to connect to server</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintServerConfig;
