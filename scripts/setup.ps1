# Install root dependencies
npm install

# Install client dependencies
Set-Location client
npm install
Set-Location ..

# Install server dependencies
Set-Location server
npm install
Set-Location ..

# Create .env files from examples
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env

Write-Host "Setup complete! You can now start the development servers with 'npm start'" 