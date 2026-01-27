const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#000000', // Match your dark theme immediately
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the local React development server
  mainWindow.loadURL('http://localhost:5173');
}

function startBackend() {
  // Resolve the path to the backend folder relative to this script
  const backendDir = path.join(__dirname, '../backend');
  
  console.log('Launching Backend from:', backendDir);

  // Spawn the Python process
  // We set 'cwd' (Current Working Directory) to ../backend so python imports work
  backendProcess = spawn('python', ['main.py'], {
    cwd: backendDir,
    stdio: 'inherit' // Pipes python logs to your terminal
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// CLEANUP: Ensure the Python process is killed when the app quits
app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});