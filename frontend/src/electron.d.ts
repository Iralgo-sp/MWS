interface ElectronAPI {
  quit: () => void;
  getDataDir: () => Promise<string>;
  openDataDir: () => Promise<void>;
  changeDataDir: () => Promise<{ canceled: boolean }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
