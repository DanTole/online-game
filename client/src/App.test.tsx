import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the game platform title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Online Game Platform/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the game list', () => {
    render(<App />);
    const gameListElement = screen.getByTestId('game-list');
    expect(gameListElement).toBeInTheDocument();
  });
}); 