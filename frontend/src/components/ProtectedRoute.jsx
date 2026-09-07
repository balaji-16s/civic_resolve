import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";


export function GovRoute({ children }) {
  const { isAuthenticated, isGov, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isGov) {
    return <Navigate to="/gov-login" replace />;
  }

  return children;
}

export function CitizenRoute({ children }) {
  const { isAuthenticated, isCitizen, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isCitizen) {
    return <Navigate to="/report" replace />;
  }

  return children;
}

export function DeptRoute({ children }) {
  const { isDept, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isDept) {
    return <Navigate to="/dept-login" replace />;
  }

  return children;
}

export function OfficerRoute({ children }) {
  const { isOfficer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isOfficer) {
    return <Navigate to="/dept-login" replace />;
  }

  return children;
}

export function HeadRoute({ children }) {
  const { isHead, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isHead) {
    return <Navigate to="/dept-login" replace />;
  }

  return children;
}
