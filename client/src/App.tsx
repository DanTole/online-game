import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import Lobby from './components/Lobby/Lobby';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Online Game Platform</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/lobby"
            element={
              <PrivateRoute>
                <Lobby />
              </PrivateRoute>
            }
          />
          <Route
            path="/lobby/:id"
            element={
              <PrivateRoute>
                <div>Lobby Room (Coming Soon)</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App; 