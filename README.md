# Online Game Platform

A real-time multiplayer game platform built with React, Node.js, and TypeScript.

## Features

- Real-time multiplayer gaming
- WebSocket-based communication
- Redis for caching and real-time data
- MongoDB for persistent storage
- Docker containerization
- CI/CD with GitHub Actions

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB, Redis
- **DevOps**: Docker, GitHub Actions
- **Testing**: Jest, React Testing Library

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/online-game.git
   cd online-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development servers:
   ```bash
   npm start
   ```

The client will run on http://localhost:3001 and the server on http://localhost:4001.

## Environment Variables

### Client (.env)
```
VITE_API_URL=http://localhost:4001
VITE_SOCKET_URL=http://localhost:4001
```

### Server (.env)
```
PORT=4001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/online-game
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3001
```

## Testing

Run tests for both client and server:
```bash
npm test
```

## Building for Production

```bash
npm run build
```

## Docker

Build and run with Docker:
```bash
docker-compose up --build
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 