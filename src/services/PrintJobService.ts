
import { FilePreview } from '../types';
import { supabase } from '../integrations/supabase/client';

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

// This service integrates with Supabase for database operations
export class PrintJobService {
  private apiBaseUrl: string;
  
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async submitPrintJob(files: FilePreview[]): Promise<SubmitPrintJobResponse> {
    try {
      console.log(`Submitting ${files.length} files to print server`);
      
      // For demonstration, we'll use both Supabase and the API
      // In a real implementation, this might be an API call that then triggers Supabase operations
      
      // First file will be our demo file
      const firstFile = files[0];
      
      // Insert the file into Supabase
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          file_name: firstFile.name,
          file_size: firstFile.size,
          file_url: firstFile.url,
          page_count: firstFile.pageCount,
          user_id: 'anonymous', // In a real app, this would be the authenticated user's ID
          status: 'uploaded'
        })
        .select()
        .single();
      
      if (fileError) {
        console.error('Error inserting file:', fileError);
        return {
          jobId: '',
          success: false,
          message: fileError.message || 'Failed to submit print job'
        };
      }
      
      // Create a print job for the file
      const { data: jobData, error: jobError } = await supabase
        .from('print_jobs')
        .insert({
          file_id: fileData.id,
          status: 'queued' // This is now a valid literal of the union type
        })
        .select()
        .single();
      
      if (jobError) {
        console.error('Error creating print job:', jobError);
        return {
          jobId: '',
          success: false,
          message: jobError.message || 'Failed to create print job'
        };
      }
      
      return {
        jobId: jobData.id,
        success: true,
        message: 'Print job submitted successfully'
      };
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
      const { data, error } = await supabase
        .from('print_jobs')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          files!inner (
            id,
            file_name
          )
        `)
        .eq('id', jobId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Ensure status is cast to the correct type
      const status = data.status as 'queued' | 'printing' | 'complete' | 'failed';
      
      return {
        id: data.id,
        fileId: data.files.id,
        fileName: data.files.file_name,
        status: status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
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
