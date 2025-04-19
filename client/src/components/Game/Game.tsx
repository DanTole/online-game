import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import './Game.css';

interface GameState {
  board: string[][];
  currentPlayer: string;
  gameStatus: 'waiting' | 'playing' | 'finished';
  players: {
    id: string;
    username: string;
    score: number;
  }[];
  validMoves: { row: number; col: number }[];
}

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    board: Array(8).fill(null).map(() => Array(8).fill('')),
    currentPlayer: '',
    gameStatus: 'waiting',
    players: [],
    validMoves: []
  });

  useEffect(() => {
    const newSocket = io('http://localhost:4001', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      newSocket.emit('game:join', gameId);
    });

    newSocket.on('game:state', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('game:error', (error: { message: string }) => {
      console.error('Game error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId]);

  const handleMove = (row: number, col: number) => {
    if (socket && gameState.gameStatus === 'playing') {
      const isValidMove = gameState.validMoves.some(
        move => move.row === row && move.col === col
      );
      if (isValidMove) {
        socket.emit('game:move', { gameId, row, col });
      }
    }
  };

  const isCurrentPlayer = () => {
    const userId = localStorage.getItem('userId');
    return gameState.currentPlayer === userId;
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Game {gameId}</h2>
        <div className="players">
          {gameState.players.map(player => (
            <div key={player.id} className={`player ${player.id === gameState.currentPlayer ? 'active' : ''}`}>
              {player.username} - Score: {player.score}
            </div>
          ))}
        </div>
      </div>
      
      <div className="game-board">
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => {
              const isValidMove = gameState.validMoves.some(
                move => move.row === rowIndex && move.col === colIndex
              );
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`board-cell ${cell ? `piece-${cell}` : ''} ${isValidMove ? 'valid-move' : ''}`}
                  onClick={() => handleMove(rowIndex, colIndex)}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="game-status">
        {gameState.gameStatus === 'waiting' && 'Waiting for players...'}
        {gameState.gameStatus === 'playing' && (
          isCurrentPlayer() ? 'Your turn' : 'Opponent\'s turn'
        )}
        {gameState.gameStatus === 'finished' && 'Game finished'}
      </div>
    </div>
  );
};

export default Game; 