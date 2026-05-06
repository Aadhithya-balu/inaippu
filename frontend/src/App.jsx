import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Track from './pages/Track';
import CitizenDashboard from './pages/citizen/Dashboard';
import OfficerDashboard from './pages/officer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/track"    element={<Track />} />

      <Route path="/citizen/*" element={
        <ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>
      } />
      <Route path="/officer/*" element={
        <ProtectedRoute role="officer"><OfficerDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
