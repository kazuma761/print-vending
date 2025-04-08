
import React from 'react';
import { CreditCard, DollarSign, Printer } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  pageCount: number;
  isProcessing: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  amount, 
  pageCount, 
  isProcessing 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Payment Required
        </h2>
        <div className="mb-6">
          <div className="text-gray-600 mb-4">
            <div className="flex justify-between mb-2">
              <span>Number of pages:</span>
              <span className="font-medium">{pageCount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Cost per page:</span>
              <span className="font-medium">₹4.00</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total amount:</span>
              <span>₹{amount.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Print Service</div>
                <div className="text-sm text-gray-500">Standard quality printing</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹{amount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
