
import React from 'react';
import { Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PageHeader: React.FC = () => {
  const { isAdmin } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Printer className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Print Service</h1>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm px-4 py-2 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
