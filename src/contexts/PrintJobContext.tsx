
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FilePreview } from '../types';
import { PrintJob, SubmitPrintJobResponse, getPrintJobService } from '../services/PrintJobService';
import { getWebSocketService } from '../services/WebSocketService';
import { appConfig } from '../config/appConfig';
import { toast } from '../hooks/use-toast';

interface PrintJobContextType {
  activeJobs: PrintJob[];
  isSubmitting: boolean;
  submitPrintJob: (files: FilePreview[]) => Promise<SubmitPrintJobResponse>;
}

const PrintJobContext = createContext<PrintJobContextType | undefined>(undefined);

export const PrintJobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJobs, setActiveJobs] = useState<PrintJob[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Initialize the WebSocket service and PrintJob service
    try {
      const wsService = getWebSocketService(appConfig.wsUrl);
      
      // Listen for job status updates
      const handleJobStatusUpdate = (data: any) => {
        if (data.jobId) {
          setActiveJobs(prevJobs => {
            // Find and update the job if it exists
            const jobIndex = prevJobs.findIndex(job => job.id === data.jobId);
            
            if (jobIndex >= 0) {
              const updatedJobs = [...prevJobs];
              updatedJobs[jobIndex] = {
                ...updatedJobs[jobIndex],
                status: data.status,
                updatedAt: new Date().toISOString()
              };
              
              // Show toast notification for status changes
              toast({
                title: "Print Job Update",
                description: `Job ${data.jobId}: ${data.status}`,
                variant: data.status === 'failed' ? "destructive" : "default",
              });
              
              return updatedJobs;
            }
            
            return prevJobs;
          });
        }
      };
      
      wsService.on('job_status', handleJobStatusUpdate);
      
      // Connect to the WebSocket server
      wsService.connect().catch(error => {
        console.error('Failed to connect to WebSocket:', error);
      });
      
      return () => {
        wsService.off('job_status', handleJobStatusUpdate);
        wsService.disconnect();
      };
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  }, []);
  
  const submitPrintJob = async (files: FilePreview[]): Promise<SubmitPrintJobResponse> => {
    setIsSubmitting(true);
    
    try {
      // Check file and page limits
      if (files.length > appConfig.maxFilesPerUser) {
        return {
          jobId: '',
          success: false,
          message: `You can only upload ${appConfig.maxFilesPerUser} files at once.`
        };
      }
      
      const totalPages = files.reduce((sum, file) => sum + file.pageCount, 0);
      if (totalPages > appConfig.maxFilesPerUser * appConfig.maxPagesPerDocument) {
        return {
          jobId: '',
          success: false,
          message: `Total pages (${totalPages}) exceed the maximum allowed.`
        };
      }
      
      // Submit the print job
      const printJobService = getPrintJobService();
      const response = await printJobService.submitPrintJob(files);
      
      // If successful, add to active jobs
      if (response.success && response.jobId) {
        const newJob: PrintJob = {
          id: response.jobId,
          fileId: 'generated', // This would come from the backend in a real implementation
          fileName: files.length === 1 ? files[0].name : `${files.length} files`,
          status: 'queued',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setActiveJobs(prevJobs => [...prevJobs, newJob]);
        
        toast({
          title: "Print Job Created",
          description: "Your print job has been submitted successfully.",
          variant: "default",
        });
      } else if (!response.success) {
        toast({
          title: "Print Job Failed",
          description: response.message || "Failed to submit print job.",
          variant: "destructive",
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error submitting print job:', error);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred when submitting your print job.",
        variant: "destructive",
      });
      
      return {
        jobId: '',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PrintJobContext.Provider value={{ activeJobs, isSubmitting, submitPrintJob }}>
      {children}
    </PrintJobContext.Provider>
  );
};

export const usePrintJob = (): PrintJobContextType => {
  const context = useContext(PrintJobContext);
  
  if (context === undefined) {
    throw new Error('usePrintJob must be used within a PrintJobProvider');
  }
  
  return context;
};
