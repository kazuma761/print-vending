
import React, { useState, useEffect } from 'react';
import { Printer, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getPrintServerUrl } from './PrinterIntegration';

interface PrintJob {
  id: string;
  fileName: string;
  pageCount: number;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
}

const PrintJobStatus: React.FC = () => {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch print jobs from server
  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getPrintServerUrl()}/api/jobs`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching print jobs:', err);
      setError('Failed to load print jobs');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch jobs on mount and every 10 seconds
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Render status icon based on job status
  const renderStatusIcon = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'printing':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Print Job Status
        </h3>
        <button
          onClick={fetchJobs}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      {isLoading && jobs.length === 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-gray-600">Loading print jobs...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}
      
      {!isLoading && jobs.length === 0 && !error && (
        <div className="text-center py-6 text-gray-500">
          No print jobs found
        </div>
      )}
      
      {jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.pageCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {renderStatusIcon(job.status)}
                      <span className="capitalize">{job.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PrintJobStatus;
