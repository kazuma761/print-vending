
import { FilePreview } from '../types';
import { supabase } from '../integrations/supabase/client';

export interface PrintJob {
  id: string;
  fileId: string;
  fileName: string;
  email: string | null;
  status: 'queued' | 'printing' | 'complete' | 'failed';
  createdAt: string;
  updatedAt: string;
  pageCount?: number;
}

export interface SubmitPrintJobResponse {
  jobId: string;
  paymentUrl?: string;
  success: boolean;
  message: string;
}

export class PrintJobService {
  private apiBaseUrl: string;
  
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async submitPrintJob(files: FilePreview[]): Promise<SubmitPrintJobResponse> {
    try {
      const userData = await supabase.auth.getUser();
      const userId = userData.data.user?.id;
      
      if (!userId) {
        return {
          jobId: '',
          success: false,
          message: 'User not authenticated'
        };
      }
      
      // Process each file and create print queue entries
      const createdJobs = [];
      
      for (const file of files) {
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .select('id')
          .eq('file_name', file.name)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (fileError || !fileRecord) {
          console.error('Error finding file record:', fileError);
          continue;
        }
        
        // Create print queue entry
        const { data: jobData, error: jobError } = await supabase
          .from('printer_queue')
          .insert({
            user_id: userId,
            file_id: fileRecord.id,
            file_name: file.name,
            page_count: file.pageCount,
            status: 'queued'
          })
          .select();
        
        if (jobError) {
          console.error('Error creating print job:', jobError);
        } else if (jobData) {
          createdJobs.push(jobData[0]);
        }
      }
      
      if (createdJobs.length === 0) {
        return {
          jobId: '',
          success: false,
          message: 'Failed to create any print jobs'
        };
      }
      
      return {
        jobId: createdJobs[0].id,
        success: true,
        message: `${createdJobs.length} print jobs submitted successfully`
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
        .from('printer_queue')
        .select(`
          id,
          file_id,
          file_name,
          status,
          created_at,
          updated_at,
          page_count,
          files!inner (id)
        `)
        .eq('id', jobId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      return {
        id: data.id,
        fileId: data.file_id,
        fileName: data.file_name,
        email: null,
        status: data.status as 'queued' | 'printing' | 'complete' | 'failed',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pageCount: data.page_count
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
