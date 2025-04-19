import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import Lobby from './components/Lobby/Lobby';
import Game from './components/Game/Game';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>Online Game Platform</h1>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 