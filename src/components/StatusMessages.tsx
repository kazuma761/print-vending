
import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface StatusMessagesProps {
  error: string;
  paymentSuccess: boolean;
  isCountingPages: boolean;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({ 
  error, 
  paymentSuccess, 
  isCountingPages 
}) => {
  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {paymentSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Payment successful! Your documents are being printed.
        </div>
      )}

      {isCountingPages && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
          Analyzing document...
        </div>
      )}
    </>
  );
};

export default StatusMessages;
