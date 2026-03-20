// frontend/lumina-front/src/app/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Импорты из shared/context
import { ThemeProvider } from '../shared/context/ThemeContext';
import { SettingsProvider } from '../shared/context/SettingsContext';
import { ViewModeProvider } from '../shared/context/ViewModeContext';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AuthLayout from '../pages/auth/AuthLayout';

// Импортируем страницы
import NotesPage from '../pages/notes/NotesPage';
import ProfilePage from '../features/profile/components/ProfilePage'; // Исправленный импорт

// Компонент для защиты маршрутов
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
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected routes */}
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

              {/* Redirect to notes if route not found */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ViewModeProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;