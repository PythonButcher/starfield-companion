const { contextBridge } = require('electron');

// Safe bridge between the frontend and the desktop environment
contextBridge.exposeInMainWorld('electronAPI', {
  // Future desktop-specific features (like saving files to disk) go here
});