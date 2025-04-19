import { Types } from 'mongoose';

export type Piece = 'black' | 'white' | '';
export type Board = Piece[][];
export type Position = { row: number; col: number };

export class GameLogic {
  private static readonly DIRECTIONS = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
  ];

  static initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(''));
    // Set up initial pieces
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
  }

  static isValidMove(board: Board, player: Piece, position: Position): boolean {
    if (board[position.row][position.col] !== '') {
      return false;
    }

    return this.DIRECTIONS.some(direction => {
      const flippedPieces = this.getFlippedPieces(board, player, position, direction);
      return flippedPieces.length > 0;
    });
  }

  static getValidMoves(board: Board, player: Piece): Position[] {
    const validMoves: Position[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(board, player, { row, col })) {
          validMoves.push({ row, col });
        }
      }
    }
    return validMoves;
  }

  static makeMove(board: Board, player: Piece, position: Position): Board {
    const newBoard = board.map(row => [...row]);
    newBoard[position.row][position.col] = player;

    this.DIRECTIONS.forEach(direction => {
      const flippedPieces = this.getFlippedPieces(board, player, position, direction);
      flippedPieces.forEach(({ row, col }) => {
        newBoard[row][col] = player;
      });
    });

    return newBoard;
  }

  static getFlippedPieces(
    board: Board,
    player: Piece,
    position: Position,
    direction: Position
  ): Position[] {
    const flippedPieces: Position[] = [];
    let currentRow = position.row + direction.row;
    let currentCol = position.col + direction.col;

    while (
      currentRow >= 0 && currentRow < 8 &&
      currentCol >= 0 && currentCol < 8
    ) {
      const currentPiece = board[currentRow][currentCol];
      if (currentPiece === '') {
        return [];
      }
      if (currentPiece === player) {
        return flippedPieces;
      }
      flippedPieces.push({ row: currentRow, col: currentCol });
      currentRow += direction.row;
      currentCol += direction.col;
    }

    return [];
  }

  static getScore(board: Board): { black: number; white: number } {
    let black = 0;
    let white = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 'black') {
          black++;
        } else if (board[row][col] === 'white') {
          white++;
        }
      }
    }

    return { black, white };
  }

  static isGameOver(board: Board): boolean {
    const blackMoves = this.getValidMoves(board, 'black');
    const whiteMoves = this.getValidMoves(board, 'white');
    return blackMoves.length === 0 && whiteMoves.length === 0;
  }
} 