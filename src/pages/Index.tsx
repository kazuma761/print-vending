
import React, { useState, useRef } from 'react';
import { Printer, Check, AlertCircle } from 'lucide-react';
import { FilePreview as FilePreviewType } from '../types';
import FileUpload from '../components/FileUpload';
import FilePreview from '../components/FilePreview';
import PaymentModal from '../components/PaymentModal';
import Instructions from '../components/Instructions';
import { calculatePages, calculateCost } from '../components/PageCalculator';
import { triggerRemotePrinting, isMobileDevice } from '../components/PrinterIntegration';
import { toast } from '../hooks/use-toast';

const Index: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FilePreviewType[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isCountingPages, setIsCountingPages] = useState(false);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload PDF, Image, or Word documents.');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    
    // Check if we've reached the maximum number of files
    if (selectedFiles.length >= 5) {
      setError('Maximum of 5 files can be uploaded at once.');
      return;
    }

    setIsCountingPages(true);
    const pageCount = await calculatePages(file);
    setIsCountingPages(false);

    // Check total page count across all files
    const currentTotalPages = selectedFiles.reduce((sum, file) => sum + file.pageCount, 0);
    if (currentTotalPages + pageCount > 50) {
      setError('Total page count exceeds 50 page limit.');
      return;
    }

    setError('');
    const fileUrl = URL.createObjectURL(file);
    const newFile = {
      name: file.name,
      url: fileUrl,
      type: file.type,
      size: file.size,
      pageCount
    };
    
    setSelectedFiles([...selectedFiles, newFile]);
    
    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };

  const handlePrintRequest = () => {
    if (selectedFiles.length === 0) return;
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create print jobs for all files
    const printJobs = selectedFiles.map(file => ({
      fileUrl: file.url,
      fileName: file.name,
      pageCount: file.pageCount
    }));
    
    // Send print jobs to remote printer
    const printResult = await triggerRemotePrinting(printJobs);
    
    setIsProcessing(false);
    setShowPaymentModal(false);
    
    if (printResult) {
      setPaymentSuccess(true);
      toast({
        title: "Print job successful",
        description: `Sent ${selectedFiles.length} file(s) to printer`,
        variant: "default",
      });
      
      // Reset payment success message after 5 seconds
      setTimeout(() => {
        setPaymentSuccess(false);
        clearAllFiles();
      }, 5000);
    } else {
      setError('Failed to send print job. Please try again.');
      toast({
        title: "Print failed",
        description: "There was an error sending your files to the printer",
        variant: "destructive",
      });
    }
  };

  const clearFile = (index: number) => {
    const newFiles = [...selectedFiles];
    URL.revokeObjectURL(newFiles[index].url);
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    setIsPreviewing(false);
  };

  const clearAllFiles = () => {
    selectedFiles.forEach(file => {
      URL.revokeObjectURL(file.url);
    });
    setSelectedFiles([]);
    setIsPreviewing(false);
  };

  const previewFile = (index: number) => {
    const file = selectedFiles[index];
    const previewWindow = window.open(file.url, '_blank');
    if (previewWindow) {
      previewWindow.onload = () => {
        setIsPreviewing(true);
      };
    }
  };

  const getTotalPages = () => {
    return selectedFiles.reduce((sum, file) => sum + file.pageCount, 0);
  };

  const getTotalCost = () => {
    return calculateCost(getTotalPages());
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
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

          {/* Main Content */}
          <div className="p-6">
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
                  <div key={index} className="mb-4">
                    <FilePreview 
                      file={file}
                      onClear={() => clearFile(index)}
                      onPreview={() => previewFile(index)}
                      onPrint={handlePrintRequest}
                      isProcessing={isProcessing}
                    />
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    onClick={handlePrintRequest}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Print All Files
                  </button>
                </div>
              </div>
            )}

            {/* Upload Section (if less than 5 files) */}
            {selectedFiles.length < 5 && (
              <FileUpload onFileSelect={handleFileSelect} />
            )}

            {/* Instructions */}
            <Instructions />
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        amount={getTotalCost()}
        pageCount={getTotalPages()}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default Index;
