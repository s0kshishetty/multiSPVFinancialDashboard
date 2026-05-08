import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    if (token && !user && !loading) {
      checkAuth();
    }
  }, [token, user, loading, checkAuth]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
