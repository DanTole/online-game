#!/bin/bash

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..

# Create .env files from examples
cp client/.env.example client/.env
cp server/.env.example server/.env

echo "Setup complete! You can now start the development servers with 'npm start'" 