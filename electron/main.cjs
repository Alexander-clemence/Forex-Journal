// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;
const isDev = !app.isPackaged;

// -------------------- Create Main Window --------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Optional: frameless window for custom titlebar
    // frame: false,
    // titleBarStyle: 'hidden',
  });

  if (isDev) {
    // Development mode: load Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: load static build
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Send maximize state changes to renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });
}

// -------------------- Auto-Updater --------------------
function initAutoUpdater() {
  // Only check for updates in production
  if (isDev) {
    console.log('Auto-updater disabled in development');
    return;
  }

  // Configure auto-updater
  autoUpdater.autoDownload = false; // Manual download control
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (mainWindow) {
      mainWindow.webContents.send('update-checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('No updates available');
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    const message = `Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent}%`;
    console.log(message);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
    
    // Show dialog to user
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The application will restart to install the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);
}

// -------------------- IPC Handlers --------------------

// App info
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-platform', () => {
  return process.platform;
});

// Auto-updater controls
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { error: 'Updates not available in development' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('start-update-download', async () => {
  if (isDev) {
    return { error: 'Updates not available in development' };
  }
  try {
    const result = await autoUpdater.downloadUpdate();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall(false, true);
});

// Window controls
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// -------------------- App Lifecycle --------------------

app.whenReady().then(() => {
  createWindow();
  
  // Initialize auto-updater only in production
  if (!isDev) {
    initAutoUpdater();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit when all windows are closed (even on macOS)
app.on('before-quit', () => {
  // Clean up if needed
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow localhost in dev mode
    if (isDev && parsedUrl.host === 'localhost:3000') {
      return;
    }
    
    // Prevent navigation to external URLs
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
      console.warn('Blocked navigation to:', navigationUrl);
    }
  });
  
  // Prevent opening new windows
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('Blocked new window:', url);
    return { action: 'deny' };
  });
});