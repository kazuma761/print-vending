
import React from 'react';
import PageHeader from '../components/PageHeader';
import PrintServerConfig from '../components/PrintServerConfig';
import PrintJobStatus from '../components/PrintJobStatus';
import PrintServerInfo from '../components/PrintServerInfo';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';

const PrintSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <PageHeader />

          {/* Main Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Link to="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-4 h-4" />
                Back to Upload
              </Link>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Printer Settings
              </h2>
            </div>

            <PrintServerConfig />
            <PrintJobStatus />
            <PrintServerInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSettings;
