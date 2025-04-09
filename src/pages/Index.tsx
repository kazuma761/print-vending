import React, { useState, useRef } from 'react';
import { FilePreview as FilePreviewType } from '../types';
import PaymentModal from '../components/PaymentModal';
import Instructions from '../components/Instructions';
import { calculatePages, calculateCost } from '../components/PageCalculator';
import { triggerRemotePrinting } from '../components/PrinterIntegration';
import { toast } from '../hooks/use-toast';
import PageHeader from '../components/PageHeader';
import StatusMessages from '../components/StatusMessages';
import FileUploadSection from '../components/FileUploadSection';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

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
          <PageHeader />

          {/* Main Content */}
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <Link 
                to="/settings" 
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Settings className="w-4 h-4" />
                Printer Settings
              </Link>
            </div>
            
            <StatusMessages 
              error={error}
              paymentSuccess={paymentSuccess}
              isCountingPages={isCountingPages}
            />

            <FileUploadSection
              selectedFiles={selectedFiles}
              isProcessing={isProcessing}
              onFileSelect={handleFileSelect}
              onClearFile={clearFile}
              onPreviewFile={previewFile}
              onPrintRequest={handlePrintRequest}
              getTotalPages={getTotalPages}
              getTotalCost={getTotalCost}
            />

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
