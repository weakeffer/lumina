import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './pages/notes/ThemeContext';
import { SettingsProvider } from './pages/notes/SettingsContext';

// Импортируем старые страницы (пока оставляем)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthLayout from './pages/auth/AuthLayout';

// Импортируем новую страницу заметок
import NotesPage from './features/notes/components/NotesPage/NotesPage';
import ProfilePage from './features/notes/components/Profile/ProfilePage';

// Компонент для защиты маршрутов
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected routes - используем новую страницу */}
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
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;