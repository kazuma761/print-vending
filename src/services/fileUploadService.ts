
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';
import { calculatePages } from '@/components/PageCalculator';

interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  pageCount?: number;
  error?: string;
}

export const createBucketIfNeeded = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const printFilesBucket = buckets?.find(bucket => bucket.name === 'print_files');
    
    if (!printFilesBucket) {
      console.log('Creating print_files bucket');
      await supabase.storage.createBucket('print_files', {
        public: true,
        fileSizeLimit: appConfig.maxFileSizeMB * 1024 * 1024,
      });
    }
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
    throw error;
  }
};

export const uploadFile = async (file: File, userId: string): Promise<UploadResponse> => {
  try {
    const timestamp = new Date().getTime();
    const filePath = `${userId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    await createBucketIfNeeded();
    
    const { error: uploadError, data } = await supabase.storage
      .from('print_files')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: fileUrlData } = supabase.storage
      .from('print_files')
      .getPublicUrl(filePath);

    const pageCount = await calculatePages(file);

    const { error: fileRecordError } = await supabase
      .from('files')
      .insert([{
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        file_url: fileUrlData.publicUrl,
        page_count: pageCount,
        status: 'uploaded'
      }]);

    if (fileRecordError) {
      throw fileRecordError;
    }

    return {
      success: true,
      fileUrl: fileUrlData.publicUrl,
      pageCount
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const checkFileUploadLimit = async (userId: string): Promise<boolean> => {
  const { data: sessionFiles, error: countError } = await supabase
    .from('files')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'uploaded');

  if (countError) {
    console.error('Error checking file count:', countError);
    return false;
  }

  return (sessionFiles?.length || 0) < appConfig.maxFilesPerUser;
};
