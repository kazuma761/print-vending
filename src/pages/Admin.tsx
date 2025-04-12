
import React from 'react';
import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "../components/AdminDashboard";
import { Navigate } from "react-router-dom";

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
      <AdminDashboard isAdmin={isAdmin} />
    </div>
  );
};

export default Admin;
