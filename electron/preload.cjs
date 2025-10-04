const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getPlatform: () => ipcRenderer.invoke('app:get-platform'),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),

  // Update events
  onUpdateChecking: (cb) => ipcRenderer.on('update-checking', cb),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (event, info) => cb(info)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update-not-available', (event, info) => cb(info)),
  onUpdateError: (cb) => ipcRenderer.on('update-error', (event, error) => cb(error)),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (event, progress) => cb(progress)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (event, info) => cb(info)),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  onMaximizeChange: (cb) => ipcRenderer.on('maximize-change', (event, isMaximized) => cb(isMaximized)),

  platform: process.platform,
  isElectron: true,
});

window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
  document.body.classList.add('electron-app');
});
