
import React from 'react';
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin access</AlertTitle>
        <AlertDescription>
          This is a placeholder for the admin dashboard. Full admin functionality will be implemented in a future update.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Admin;
