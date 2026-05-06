import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  // Not logged in → login
  if (!token || !user) return <Navigate to="/login" replace />;

  // Wrong role → redirect to their own dashboard
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  return children;
};

export default ProtectedRoute;
