const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const backendOrigin = 'http://127.0.0.1:5000';
let backendProcess;

async function healthy() {
  try {
    const response = await fetch(backendOrigin + '/api/health', { signal: AbortSignal.timeout(1000) });
    return response.ok && (await response.json()).status === 'systems_nominal';
  } catch { return false; }
}

async function startBackend() {
  if (await healthy()) return; // Reuse a running companion; never terminate somebody else's process.
  const root = path.resolve(__dirname, '..');
  const localPython = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  backendProcess = spawn(fs.existsSync(localPython) ? localPython : 'python', ['main.py'], {
    cwd: path.join(root, 'backend'), stdio: 'inherit', windowsHide: true,
  });
  let failure;
  backendProcess.on('error', (error) => { failure = error; });
  backendProcess.on('exit', (code) => { failure = new Error('Backend exited with code ' + code); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (failure) throw failure;
    if (await healthy()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Backend did not become ready. Check port 5000 and install backend requirements.');
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440, height: 950, backgroundColor: '#0b0c15',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true,
    },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  await window.loadURL(process.env.STARFIELD_DEV_URL || backendOrigin);
}

app.whenReady().then(async () => {
  try {
    if (!process.env.STARFIELD_DEV_URL && !fs.existsSync(path.join(__dirname, '../frontend/dist/index.html'))) {
      throw new Error('Build the frontend first: npm --prefix frontend run build');
    }
    await startBackend();
    await createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  } catch (error) {
    dialog.showErrorBox('Starfield launch failed', error.message);
    app.quit();
  }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { if (backendProcess) backendProcess.kill(); });
