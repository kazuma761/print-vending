
import React from 'react';
import { Printer } from 'lucide-react';
import AuthNavigation from './AuthNavigation';

const PageHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Printer className="w-8 h-8 text-white mr-3" />
          <h1 className="text-2xl font-bold text-white">PrintEase</h1>
        </div>
        <AuthNavigation />
      </div>
      <p className="text-blue-100 mt-2">
        Quick and easy document printing service
      </p>
    </div>
  );
};

export default PageHeader;
