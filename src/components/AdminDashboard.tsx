
import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { PrintJob } from '../services/PrintJobService';
import { FilePreview } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  isAdmin: boolean;
}

interface PrintJobWithFile extends PrintJob {
  user_id?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isAdmin }) => {
  const [printJobs, setPrintJobs] = useState<PrintJobWithFile[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all print jobs with file information
        const { data: jobsData, error: jobsError } = await supabase
          .from('print_jobs')
          .select(`
            id,
            status,
            created_at,
            updated_at,
            files!inner (
              id,
              file_name,
              file_size,
              page_count,
              user_id,
              file_url
            )
          `)
          .order('created_at', { ascending: false });
        
        if (jobsError) throw jobsError;
        
        const formattedJobs: PrintJobWithFile[] = jobsData.map(job => ({
          id: job.id,
          fileId: job.files.id,
          fileName: job.files.file_name,
          status: job.status as 'queued' | 'printing' | 'complete' | 'failed',
          createdAt: job.created_at,
          updatedAt: job.updated_at,
          user_id: job.files.user_id
        }));
        
        setPrintJobs(formattedJobs);
        
        // Fetch all files
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (filesError) throw filesError;
        
        setFiles(filesData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [isAdmin]);
  
  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (loading) {
    return <div className="p-4">Loading admin dashboard...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Print Jobs</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No print jobs found</TableCell>
              </TableRow>
            ) : (
              printJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.id}</TableCell>
                  <TableCell>{job.fileName}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      job.status === 'complete' ? 'bg-green-100 text-green-800' :
                      job.status === 'failed' ? 'bg-red-100 text-red-800' :
                      job.status === 'printing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{job.user_id}</TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(job.updatedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No files found</TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.file_name}</TableCell>
                  <TableCell>{(file.file_size / 1024).toFixed(2)} KB</TableCell>
                  <TableCell>{file.page_count}</TableCell>
                  <TableCell className="font-mono text-xs">{file.user_id}</TableCell>
                  <TableCell>{new Date(file.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <a 
                      href={file.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDashboard;
