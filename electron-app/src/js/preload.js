const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("ipc", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  once: (channel, callback) => ipcRenderer.once(channel, callback),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  removeListener: (channel, callback) =>
    window.ipc.removeListener(channel, callback),
});
