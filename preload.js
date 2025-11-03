const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Configurações de privacidade
  getPrivacySettings: () => ipcRenderer.invoke('get-privacy-settings'),
  setPrivacySettings: (settings) => ipcRenderer.invoke('set-privacy-settings', settings),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  
  // Utilitários
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Controle de janela
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Favoritos
  favoritesAdd: (data) => ipcRenderer.invoke('favorites-add', data),
  favoritesRemove: (id) => ipcRenderer.invoke('favorites-remove', id),
  favoritesRemoveByUrl: (url) => ipcRenderer.invoke('favorites-remove-by-url', url),
  favoritesGetAll: () => ipcRenderer.invoke('favorites-get-all'),
  favoritesCheck: (url) => ipcRenderer.invoke('favorites-check', url),
  
  // Histórico
  historyAdd: (data) => ipcRenderer.invoke('history-add', data),
  historyUpdateTitle: (data) => ipcRenderer.invoke('history-update-title', data),
  historyUpdateFavicon: (data) => ipcRenderer.invoke('history-update-favicon', data),
  historyGet: (options) => ipcRenderer.invoke('history-get', options),
  historySearch: (query, limit) => ipcRenderer.invoke('history-search', query, limit),
  historyDelete: (id) => ipcRenderer.invoke('history-delete', id),
  historyClear: () => ipcRenderer.invoke('history-clear'),
  historyDeleteOld: (days) => ipcRenderer.invoke('history-delete-old', days),
  
  // Downloads
  downloadStart: (data) => ipcRenderer.invoke('download-start', data),
  downloadsGetAll: (options) => ipcRenderer.invoke('downloads-get-all', options),
  downloadDelete: (id) => ipcRenderer.invoke('download-delete', id),
  downloadsClearCompleted: () => ipcRenderer.invoke('downloads-clear-completed'),
  
  // Eventos de download
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', callback),
  onDownloadStarted: (callback) => ipcRenderer.on('download-started', callback),
  
  // Eventos
  onNewTab: (callback) => ipcRenderer.on('new-tab', callback),
  onCloseTab: (callback) => ipcRenderer.on('close-tab', callback),
  onOpenPrivacySettings: (callback) => ipcRenderer.on('open-privacy-settings', callback),
  onShowMessage: (callback) => ipcRenderer.on('show-message', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  
  // Remover listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Gerenciamento de sessões isoladas
  getIsolatedSession: (tabId) => ipcRenderer.invoke('get-isolated-session', tabId),
  destroyIsolatedSession: (tabId) => ipcRenderer.invoke('destroy-isolated-session', tabId),
  
  // Gerenciamento de temas
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  
  // Estatísticas de privacidade
  getPrivacyStats: () => ipcRenderer.invoke('get-privacy-stats'),
  resetPrivacyStats: () => ipcRenderer.invoke('reset-privacy-stats'),
  
  // Fullscreen
  enterFullscreen: () => ipcRenderer.invoke('enter-fullscreen'),
  leaveFullscreen: () => ipcRenderer.invoke('leave-fullscreen'),
  onFullscreenChanged: (callback) => ipcRenderer.on('fullscreen-changed', callback),
  
  // Utilitários
  getIconPath: () => ipcRenderer.invoke('get-icon-path'),
  
  // Criptografia
  encryptionGetStatus: () => ipcRenderer.invoke('encryption-get-status'),
  encryptionSetEnabled: (enabled) => ipcRenderer.invoke('encryption-set-enabled', enabled),
  encryptionReEncryptAll: () => ipcRenderer.invoke('encryption-re-encrypt-all')
});

