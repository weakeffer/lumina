import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { SettingsProvider } from '../shared/context/SettingsContext';
import { ViewModeProvider } from '../shared/context/ViewModeContext';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AuthLayout from '../pages/auth/AuthLayout';

import NotesPage from '../pages/notes/NotesPage';
import ProfilePage from '../features/profile/components/ProfilePage';
import InsightsPage from '../pages/insights/InsightsPage';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ViewModeProvider>
          <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <NotesPage />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/note/:id"
                element={
                  <PrivateRoute>
                    <NotesPage />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/insights"
                element={
                  <PrivateRoute>
                    <InsightsPage />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ViewModeProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;