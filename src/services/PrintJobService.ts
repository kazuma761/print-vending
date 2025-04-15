
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
        // First, check if the file already exists in the database
        const { data: existingFiles, error: existingError } = await supabase
          .from('files')
          .select('id')
          .eq('file_name', file.name)
          .eq('user_id', userId);
        
        let fileId;
        
        if (existingError) {
          console.error('Error checking existing files:', existingError);
          continue;
        }
        
        // If file doesn't exist in the database yet, create it
        if (!existingFiles || existingFiles.length === 0) {
          // Create file record first
          const { data: newFile, error: fileError } = await supabase
            .from('files')
            .insert({
              user_id: userId,
              file_name: file.name,
              file_url: file.url,
              file_size: file.size || 0,
              page_count: file.pageCount,
              status: 'uploaded'
            })
            .select()
            .single();
          
          if (fileError || !newFile) {
            console.error('Error creating file record:', fileError);
            continue;
          }
          
          fileId = newFile.id;
        } else {
          fileId = existingFiles[0].id;
        }
        
        // Create print queue entry
        const { data: jobData, error: jobError } = await supabase
          .from('printer_queue')
          .insert({
            user_id: userId,
            file_id: fileId,
            file_name: file.name,
            page_count: file.pageCount || 1,
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
          email
        `)
        .eq('id', jobId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting job status:', error);
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      return {
        id: data.id,
        fileId: data.file_id,
        fileName: data.file_name,
        email: data.email,
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
