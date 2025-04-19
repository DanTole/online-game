import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';

interface Lobby {
  _id: string;
  name: string;
  host: {
    username: string;
  };
  maxPlayers: number;
  currentPlayers: Array<{
    playerId: string;
    username: string;
    isReady: boolean;
  }>;
  isPrivate: boolean;
  gameType: string;
  status: 'waiting' | 'playing' | 'finished';
}

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [newLobby, setNewLobby] = useState({
    name: '',
    maxPlayers: 4,
    isPrivate: false,
    password: '',
    gameType: 'default'
  });

  useEffect(() => {
    fetchLobbies();
  }, []);

  const fetchLobbies = async () => {
    try {
      const response = await fetch('/api/lobbies');
      if (!response.ok) throw new Error('Failed to fetch lobbies');
      const data = await response.json();
      setLobbies(data);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
    }
  };

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/lobbies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newLobby)
      });

      if (!response.ok) throw new Error('Failed to create lobby');
      const createdLobby = await response.json();
      navigate(`/lobby/${createdLobby._id}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      const response = await fetch(`/api/lobbies/${lobbyId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to join lobby');
      navigate(`/lobby/${lobbyId}`);
    } catch (error) {
      console.error('Error joining lobby:', error);
    }
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Game Lobbies</h1>
        <button onClick={() => setShowCreateLobby(true)}>Create Lobby</button>
      </div>

      {showCreateLobby && (
        <div className="create-lobby-modal">
          <h2>Create New Lobby</h2>
          <form onSubmit={handleCreateLobby}>
            <div className="form-group">
              <label>Lobby Name</label>
              <input
                type="text"
                value={newLobby.name}
                onChange={(e) => setNewLobby({ ...newLobby, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Max Players</label>
              <input
                type="number"
                min="2"
                max="8"
                value={newLobby.maxPlayers}
                onChange={(e) => setNewLobby({ ...newLobby, maxPlayers: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={newLobby.isPrivate}
                  onChange={(e) => setNewLobby({ ...newLobby, isPrivate: e.target.checked })}
                />
                Private Lobby
              </label>
            </div>
            {newLobby.isPrivate && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newLobby.password}
                  onChange={(e) => setNewLobby({ ...newLobby, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-actions">
              <button type="submit">Create</button>
              <button type="button" onClick={() => setShowCreateLobby(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="lobbies-list">
        {lobbies.map((lobby) => (
          <div key={lobby._id} className="lobby-card">
            <h3>{lobby.name}</h3>
            <p>Host: {lobby.host.username}</p>
            <p>Players: {lobby.currentPlayers.length}/{lobby.maxPlayers}</p>
            <p>Status: {lobby.status}</p>
            <p>Game Type: {lobby.gameType}</p>
            <button onClick={() => handleJoinLobby(lobby._id)}>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lobby; 