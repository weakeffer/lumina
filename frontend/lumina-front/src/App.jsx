import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './pages/notes/ThemeContext';
import { SettingsProvider } from './pages/notes/SettingsContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Notes from './pages/notes/Notes';
import Profile from './pages/notes/Profile';
import './index.css'; 

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/notes" replace /> : children;
};

function App() {
    return (
        <ThemeProvider>
            <SettingsProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        } />
                        
                        <Route path="/register" element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        } />
                        
                        <Route path="/notes" element={
                            <PrivateRoute>
                                <Notes />
                            </PrivateRoute>
                        } />
                        
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <Profile />
                            </PrivateRoute>
                        } />

                        <Route path="/notes/:id" element={
                            <PrivateRoute>
                                <Notes />
                            </PrivateRoute>
                        } />
                        
                        <Route path="/" element={
                            <Navigate to="/notes" replace />
                        } />
                        
                        <Route path="*" element={
                            <Navigate to="/notes" replace />
                        } />
                    </Routes>
                </Router>
            </SettingsProvider>
        </ThemeProvider>
    );
}

export default App;