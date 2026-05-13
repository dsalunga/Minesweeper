const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 760,
    minWidth: 520,
    minHeight: 600,
    backgroundColor: '#0c1024',
    title: 'Minesweeper',
    webPreferences: { contextIsolation: true }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
