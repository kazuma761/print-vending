
import { FilePreview } from '../types';

export interface PrintJob {
  id: string;
  fileId: string;
  fileName: string;
  status: 'queued' | 'printing' | 'complete' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface SubmitPrintJobResponse {
  jobId: string;
  paymentUrl?: string;
  success: boolean;
  message: string;
}

// This service would integrate with your actual backend APIs
export class PrintJobService {
  private apiBaseUrl: string;
  
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async submitPrintJob(files: FilePreview[]): Promise<SubmitPrintJobResponse> {
    try {
      // In a real implementation, this would submit the files to your backend
      // via the API Gateway, which would then store them in Supabase
      
      console.log(`Submitting ${files.length} files to print server`);
      
      // Mock API call - replace with actual API integration
      const response = await fetch(`${this.apiBaseUrl}/print-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: files.map(file => ({
            name: file.name,
            url: file.url,
            size: file.size,
            pageCount: file.pageCount
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit print job');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting print job:', error);
      return {
        jobId: '',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async getPrintJobStatus(jobId: string): Promise<PrintJob | null> {
    try {
      // Mock API call - replace with actual API integration
      const response = await fetch(`${this.apiBaseUrl}/print-jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get print job status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting print job status:', error);
      return null;
    }
  }
}

// Singleton instance
let instance: PrintJobService | null = null;

export const getPrintJobService = (apiBaseUrl?: string): PrintJobService => {
  if (!instance && apiBaseUrl) {
    instance = new PrintJobService(apiBaseUrl);
  }
  if (!instance) {
    throw new Error('PrintJobService not initialized');
  }
  return instance;
};

export const initPrintJobService = (apiBaseUrl: string): PrintJobService => {
  instance = new PrintJobService(apiBaseUrl);
  return instance;
};
