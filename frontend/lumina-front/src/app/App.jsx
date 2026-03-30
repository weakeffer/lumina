import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { SettingsProvider } from '../shared/context/SettingsContext';
import { ViewModeProvider } from '../shared/context/ViewModeContext';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AuthLayout from '../pages/auth/AuthLayout';

import NotesPage from '../pages/notes/NotesPage';
import ProfilePage from '../features/profile/components/ProfilePage';

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
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ViewModeProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;