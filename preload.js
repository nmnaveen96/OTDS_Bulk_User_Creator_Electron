
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('otdsDesktop', {
  token: payload => ipcRenderer.invoke('otds-token', payload),
  request: payload => ipcRenderer.invoke('otds-request', payload),
  showError: message => ipcRenderer.invoke('show-error', message)
});
