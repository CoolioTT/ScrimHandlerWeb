import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import ScrimBoard from './components/ScrimBoard';
import CreateScrim from './components/CreateScrim';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Axios interceptor for auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/user/profile`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      localStorage.setItem('token', access_token);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header user={user} logout={logout} />
        
        <main className="flex-1">
          <Routes>
            <Route 
              path="/login" 
              element={
                !user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/register" 
              element={
                !user ? <Register onRegister={register} /> : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user ? <Dashboard user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/team" 
              element={
                user ? <TeamManagement user={user} setUser={setUser} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/scrims" 
              element={
                user ? <ScrimBoard user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/create-scrim" 
              element={
                user ? <CreateScrim user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/profile" 
              element={
                user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/admin" 
              element={
                user && user.is_admin ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/" 
              element={
                user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;