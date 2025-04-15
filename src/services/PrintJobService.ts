
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
      
      const userData = await supabase.auth.getUser();
      const userId = userData.data.user?.id;
      
      if (!userId) {
        console.error('No authenticated user found');
        return {
          jobId: '',
          success: false,
          message: 'User not authenticated'
        };
      }
      
      // Process each file
      for (const file of files) {
        console.log('Processing file:', file.name);
        
        // Skip files that are already in database
        const { data: existingFile } = await supabase
          .from('files')
          .select('id')
          .eq('file_name', file.name)
          .eq('user_id', userId)
          .maybeSingle();
          
        if (existingFile) {
          console.log('File already exists in database:', file.name);
          continue;
        }
        
        // Insert the file into Supabase
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            file_name: file.name,
            file_size: file.size,
            file_url: file.url,
            page_count: file.pageCount,
            user_id: userId,
            status: 'uploaded'
          })
          .select();
        
        if (fileError) {
          console.error(`Error inserting file ${file.name}:`, fileError);
        } else {
          console.log(`File record created for ${file.name}:`, fileData);
        }
      }
      
      // Get all files for this user to create print jobs
      const { data: userFiles, error: userFilesError } = await supabase
        .from('files')
        .select('id, file_name, email')
        .eq('user_id', userId)
        .eq('status', 'uploaded')
        .limit(files.length);
      
      if (userFilesError || !userFiles || userFiles.length === 0) {
        console.error('Error getting user files:', userFilesError);
        return {
          jobId: '',
          success: false,
          message: 'Failed to retrieve file records'
        };
      }
      
      console.log('Retrieved user files:', userFiles);
      
      // Create a print job for each file
      let createdJobs = [];
      
      for (const file of userFiles) {
        console.log('Creating print job for file ID:', file.id);
        
        const { data: jobData, error: jobError } = await supabase
          .from('print_jobs')
          .insert({
            file_id: file.id,
            file_name: file.file_name,
            status: 'queued'
          })
          .select();
        
        if (jobError) {
          console.error(`Error creating print job for file ${file.file_name}:`, jobError);
        } else if (jobData) {
          console.log(`Print job created for ${file.file_name}:`, jobData);
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
      
      // Create a payment record
      const totalCost = files.reduce((total, file) => total + file.pageCount * 4, 0); // ₹4 per page
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: totalCost,
          status: 'completed',
          currency: 'INR'
        });
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      } else {
        console.log('Payment record created successfully');
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
        .from('print_jobs')
        .select(`
          id,
          file_id,
          file_name,
          email,
          status,
          created_at,
          updated_at,
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
      
      // Ensure status is cast to the correct type
      const status = data.status as 'queued' | 'printing' | 'complete' | 'failed';
      
      return {
        id: data.id,
        fileId: data.file_id,
        fileName: data.file_name || '',
        email: data.email,
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
