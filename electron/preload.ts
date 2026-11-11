import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  quit: () => ipcRenderer.send("app:quit"),
  getDataDir: (): Promise<string> => ipcRenderer.invoke("app:getDataDir"),
  openDataDir: (): Promise<void> => ipcRenderer.invoke("app:openDataDir"),
  changeDataDir: (): Promise<{ canceled: boolean }> => ipcRenderer.invoke("app:changeDataDir"),
});
