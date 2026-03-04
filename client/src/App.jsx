import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/Dashboard/Admin';
import DriverDashboard from './pages/Dashboard/Driver';
import CustomerDashboard from './pages/Dashboard/Customer';
import Profile from './pages/Profile';
import useAuthStore from './store/authStore';
import NotFound from './pages/NotFound';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Customize as needed
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"IntelliFont", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen bg-transparent">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard/admin/*"
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/driver/*"
              element={
                <PrivateRoute allowedRoles={['Driver']}>
                  <DriverDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/customer/*"
              element={
                <PrivateRoute allowedRoles={['Customer']}>
                  <CustomerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                color: '#1F2933',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
