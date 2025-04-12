
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
      
      if (files.length === 0) {
        return {
          jobId: '',
          success: false,
          message: 'No files selected for printing'
        };
      }
      
      // First file will be our demo file
      const firstFile = files[0];
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        console.error('No authenticated user found');
        return {
          jobId: '',
          success: false,
          message: 'User not authenticated'
        };
      }
      
      console.log('Creating file record for', firstFile.name, 'by user', userId);
      
      // Insert the file into Supabase
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .upsert({
          file_name: firstFile.name,
          file_size: firstFile.size,
          file_url: firstFile.url,
          page_count: firstFile.pageCount,
          user_id: userId,
          status: 'uploaded'
        })
        .select();
      
      if (fileError) {
        console.error('Error inserting file:', fileError);
        return {
          jobId: '',
          success: false,
          message: fileError.message || 'Failed to submit print job'
        };
      }
      
      console.log('File record created:', fileData);
      
      // Create a print job for the file
      const fileId = fileData?.[0]?.id;
      
      if (!fileId) {
        console.error('No file ID returned from file insertion');
        return {
          jobId: '',
          success: false,
          message: 'Failed to create file record'
        };
      }
      
      console.log('Creating print job for file ID:', fileId);
      
      // Create a print job for the file
      const { data: jobData, error: jobError } = await supabase
        .from('print_jobs')
        .insert({
          file_id: fileId,
          status: 'queued'
        })
        .select();
      
      if (jobError) {
        console.error('Error creating print job:', jobError);
        return {
          jobId: '',
          success: false,
          message: jobError.message || 'Failed to create print job'
        };
      }
      
      console.log('Print job created:', jobData);
      
      return {
        jobId: jobData[0].id,
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
