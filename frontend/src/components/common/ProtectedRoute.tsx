import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

// Flag to check if auth is bypassed in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const bypassAuthInDevelopment = true;

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'user' | 'viewer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [showDevNotice, setShowDevNotice] = React.useState(isDevelopment && bypassAuthInDevelopment);

  // Show loading spinner while checking authentication
  if (loading && !(isDevelopment && bypassAuthInDevelopment)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // In development mode with bypass enabled, always render the protected content
  if (isDevelopment && bypassAuthInDevelopment) {
    console.log('Development mode: Authentication bypassed for route:', location.pathname);
    return (
      <>
        <Outlet />
        
        {/* Development mode notice */}
        <Snackbar 
          open={showDevNotice} 
          autoHideDuration={6000} 
          onClose={() => setShowDevNotice(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity="info" 
            onClose={() => setShowDevNotice(false)} 
            sx={{ width: '100%' }}
          >
            Development mode: Authentication is bypassed.
          </Alert>
        </Snackbar>
      </>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required but user doesn't have it, redirect to unauthorized
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role, render the protected content
  return <Outlet />;
};

export default ProtectedRoute; 