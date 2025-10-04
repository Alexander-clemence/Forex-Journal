// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// -------------------- Create Main Window --------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (!app.isPackaged) {
    // Dev mode: load Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Production: serve static files from 'out' directory
    const outPath = path.join(process.resourcesPath, 'out');
    
    // Register file protocol handler BEFORE loading
    protocol.interceptFileProtocol('file', (request, callback) => {
      let url = decodeURIComponent(request.url);
      
      // Remove 'file://' prefix and normalize
      url = url.replace(/^file:\/\//, '');
      
      // Handle Windows paths (remove extra slash)
      if (process.platform === 'win32' && url.startsWith('/')) {
        url = url.substring(1);
      }
      
      // Build file path
      let filePath;
      
      // Check if it's a _next asset request
      if (url.includes('/_next/')) {
        // Extract the _next path portion
        const nextIndex = url.indexOf('/_next/');
        const nextPath = url.substring(nextIndex);
        filePath = path.join(outPath, nextPath);
      } else {
        // For other requests, construct path relative to out directory
        // Remove leading slash if present
        const relativePath = url.startsWith('/') ? url.substring(1) : url;
        filePath = path.join(outPath, relativePath);
      }
      
      // Block .rsc requests (React Server Component payloads don't exist in static export)
      if (url.endsWith('.rsc')) {
        console.log('Blocked .rsc request:', url);
        callback({ error: -6 }); // FILE_NOT_FOUND
        return;
      }
      
      // If it's a directory, serve index.html
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      
      // If file doesn't exist and doesn't have an extension, try adding .html
      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        const htmlPath = path.join(filePath, 'index.html');
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
        }
      }
      
      // Only fallback to root index.html for HTML requests
      if (!fs.existsSync(filePath)) {
        // Don't serve index.html for JS/CSS/asset requests
        const ext = path.extname(url);
        if (ext && ext !== '.html' && ext !== '') {
          console.error('File not found:', filePath);
          callback({ error: -6 }); // FILE_NOT_FOUND
          return;
        }
        // For routes without extensions, serve the appropriate HTML file
        filePath = path.join(outPath, 'index.html');
      }
      
      callback({ path: filePath });
    });

    const indexPath = path.join(outPath, 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

// -------------------- Auto-Updater --------------------
function initAutoUpdater() {
  autoUpdater.autoDownload = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    mainWindow.webContents.send('update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('No updates:', info);
    mainWindow.webContents.send('update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    mainWindow.webContents.send('update-error', err);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    mainWindow.webContents.send('update-downloaded', info);
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart now?',
      buttons: ['Restart', 'Later'],
    }).then(result => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdatesAndNotify();
}

// -------------------- Window Control IPC --------------------
ipcMain.on('minimize-window', () => mainWindow.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('close-window', () => mainWindow.close());

// -------------------- App Events --------------------
app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged) initAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});