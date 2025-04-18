import React from 'react';
import { Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Online Game Platform</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<div>Welcome to Online Game Platform</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default App; 