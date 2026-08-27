import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Login from './pages/Login';
import CreateProfileChoice from './pages/CreateProfileChoice';
import VolunteerProfileForm from './pages/VolunteerProfileForm';
import OrganizerProfileForm from './pages/OrganizerProfileForm';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />

          <Route path="/create-profile" element={<ProtectedRoute><CreateProfileChoice /></ProtectedRoute>} />
          <Route path="/create-profile/volunteer" element={<ProtectedRoute><VolunteerProfileForm /></ProtectedRoute>} />
          <Route path="/create-profile/organizer" element={<ProtectedRoute><OrganizerProfileForm /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
