const { app, BrowserWindow, session, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const db = require('./database/db');
const fs = require('fs');
const cryptoUtils = require('./utils/crypto');

// Definir nome do aplicativo
app.setName('Catnip Secure Browser');

const store = new Store();

// Estatísticas de privacidade (rastreadores, anúncios bloqueados, etc.)
let privacyStats = {
  trackersBlocked: 0,
  adsBlocked: 0,
  thirdPartyCookiesBlocked: 0,
  thirdPartyScriptsBlocked: 0,
  topTrackers: {}, // { domain: count }
  lastUpdated: new Date().toISOString()
};

// Carregar estatísticas salvas
const savedStats = store.get('privacyStats');
if (savedStats) {
  privacyStats = { ...privacyStats, ...savedStats };
}

// Salvar estatísticas periodicamente
setInterval(() => {
  store.set('privacyStats', privacyStats);
}, 5000); // Salvar a cada 5 segundos

// Configurações de privacidade padrão
const defaultPrivacySettings = {
  blockTrackers: true,
  blockAds: true,
  blockFingerprinting: true,
  httpsOnly: false,
  blockThirdPartyCookies: true,
  blockThirdPartyScripts: false,
  clearDataOnExit: true,
  doNotTrack: true,
  disableWebGL: false,
  disableCanvas: false,
  disableWebAudio: false,
  disableNotifications: true,
  disableGeolocation: true
};

// Carregar configurações salvas ou usar padrões
let privacySettings = store.get('privacySettings', defaultPrivacySettings);

// Função para aplicar configurações de privacidade
function applyPrivacySettings() {
  // Aplicar para sessão padrão (usada por webviews)
  const ses = session.defaultSession;
  
  // Nota: Não precisamos remover listeners - cada listener é único e pode ser adicionado
  // Se necessário, podemos adicionar verificação para evitar duplicatas

  // Bloquear rastreadores e anúncios
  if (privacySettings.blockTrackers || privacySettings.blockAds) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url.toLowerCase();
      
      // Lista expandida de domínios de rastreamento (baseada em EasyList/EasyPrivacy)
      const trackerDomains = [
        // Google
        'doubleclick.net',
        'googleadservices.com',
        'googlesyndication.com',
        'google-analytics.com',
        'googletagmanager.com',
        'googletagservices.com',
        'googleadapis.com',
        'google-analytics.com',
        'googlesyndication.com',
        'gstatic.com/analytics',
        'google.com/ads',
        'google.com/analytics',
        // Facebook
        'facebook.com/tr',
        'facebook.com/connect',
        'facebook.net',
        'facebookads.com',
        'fbcdn.net',
        'fb.com',
        // Amazon
        'amazon-adsystem.com',
        'amazon.com/ads',
        'assoc-amazon.com',
        // Microsoft
        'bing.com/maps',
        'live.com/analytics',
        'microsoftadvertising.com',
        'msads.net',
        // Adobe
        'omniture.com',
        '2o7.net',
        'adobe.com/analytics',
        'demdex.net',
        // Outros rastreadores comuns
        'scorecardresearch.com',
        'quantserve.com',
        'advertising.com',
        'adsafeprotected.com',
        'moatads.com',
        'outbrain.com',
        'taboola.com',
        'adnxs.com',
        'rubiconproject.com',
        'pubmatic.com',
        'openx.net',
        'criteo.com',
        'bluekai.com',
        'crwdcntrl.net',
        'rlcdn.com',
        'serving-sys.com',
        'adform.com',
        'casalemedia.com',
        'adtechus.com',
        'media.net',
        'adfox.ru',
        'amazon-adsystem.com',
        'adsrvr.org',
        'adtechus.com',
        'brealtime.com',
        'chartbeat.com',
        'clicktale.net',
        'crazyegg.com',
        'hotjar.com',
        'mixpanel.com',
        'segment.io',
        'segment.com',
        'newrelic.com',
        'optimizely.com',
        'uservoice.com',
        'zendesk.com',
        'pardot.com',
        'marketo.com',
        'hubspot.com/analytics',
        'salesforce.com/analytics',
        'adroll.com',
        'klaviyo.com',
        'mailchimp.com/track',
        'marketo.net',
        'pardot.com',
        'salesforce.com/api',
        // CDNs de anúncios
        'cdnjs.cloudflare.com/ajax/libs/analytics',
        'cdn.ampproject.org/rtv',
        // Rastreadores de terceiros comuns
        'sharethrough.com',
        'teads.tv',
        'yieldmo.com',
        '33across.com',
        'contextweb.com',
        'districtm.io',
        'freewheel.tv',
        'indexexchange.com',
        'lockerdome.com',
        'sonobi.com',
        'synacor.com',
        'tremorhub.com',
        'triplelift.com',
        'video.unrulymedia.com',
        'w55c.net'
      ];

      // Padrões comuns de URLs de rastreadores/anúncios
      const trackerPatterns = [
        '/analytics.js',
        '/analytics.min.js',
        '/gtm.js',
        '/gtag.js',
        '/ga.js',
        '/gaq.js',
        '/facebook.js',
        '/facebook-pixel',
        '/pixel.js',
        '/tracking.js',
        '/track.js',
        '/beacon',
        '/click',
        '/impression',
        '/event',
        '/collect',
        '/pageview',
        '/ads.js',
        '/advertisement.js',
        '/advertising.js',
        '/banner.js',
        '/adsense',
        '/adserving',
        '/adservice',
        '/adsystem',
        '/tracker',
        '/tracking',
        '/analytics',
        '/metrics',
        '/stats',
        '/pixel',
        '/beacon'
      ];

      // Não bloquear imagens, vídeos, CSS ou fontes (exceto se for claramente rastreador)
      if (['stylesheet', 'font'].includes(details.resourceType)) {
        callback({});
        return;
      }

      // Verificar se é domínio de rastreador
      const isTrackerDomain = trackerDomains.some(domain => url.includes(domain));
      
      // Verificar se URL contém padrões de rastreadores
      const hasTrackerPattern = trackerPatterns.some(pattern => url.includes(pattern));
      
      // Verificar se é script de analytics/tracking
      const isTrackingScript = details.resourceType === 'script' && (
        url.includes('analytics') ||
        url.includes('tracking') ||
        url.includes('tracker') ||
        url.includes('pixel') ||
        url.includes('beacon') ||
        url.includes('gtm') ||
        url.includes('gtag') ||
        url.includes('facebook-pixel') ||
        url.includes('facebook.com/tr') ||
        url.includes('doubleclick')
      );

      const isTracker = isTrackerDomain || (isTrackingScript && details.resourceType === 'script');
      const isAd = hasTrackerPattern || isTrackerDomain;

      if ((privacySettings.blockTrackers && isTracker && details.resourceType !== 'image' && details.resourceType !== 'media') || 
          (privacySettings.blockAds && isAd && details.resourceType !== 'image' && details.resourceType !== 'media')) {
        // Registrar estatística
        try {
          const urlObj = new URL(details.url);
          const domain = urlObj.hostname;
          
          if (privacySettings.blockTrackers && isTracker) {
            privacyStats.trackersBlocked++;
            privacyStats.topTrackers[domain] = (privacyStats.topTrackers[domain] || 0) + 1;
          }
          
          if (privacySettings.blockAds && isAd) {
            privacyStats.adsBlocked++;
            privacyStats.topTrackers[domain] = (privacyStats.topTrackers[domain] || 0) + 1;
          }
          
          privacyStats.lastUpdated = new Date().toISOString();
        } catch (e) {
          // Ignorar erros de parsing de URL
        }
        
        callback({ cancel: true });
        return;
      }

      callback({});
    });
  }

  // Bloquear cookies de terceiros
  if (privacySettings.blockThirdPartyCookies) {
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = new URL(details.url);
      const referer = details.requestHeaders.Referer || '';
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          if (url.origin !== refererUrl.origin) {
            delete details.requestHeaders.Cookie;
            // Registrar cookie bloqueado
            privacyStats.thirdPartyCookiesBlocked++;
            privacyStats.lastUpdated = new Date().toISOString();
          }
        } catch (e) {
          // Se não conseguir parsear, bloquear por segurança
          delete details.requestHeaders.Cookie;
          privacyStats.thirdPartyCookiesBlocked++;
          privacyStats.lastUpdated = new Date().toISOString();
        }
      }
      
      // Adicionar cabeçalho Do Not Track
      if (privacySettings.doNotTrack) {
        details.requestHeaders['DNT'] = '1';
      }

      callback({ requestHeaders: details.requestHeaders });
    });
  }

  // Bloquear scripts de terceiros (mas permitir CSS e imagens)
  if (privacySettings.blockThirdPartyScripts) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      // Permitir imagens, vídeos, áudios e CSS de qualquer origem
      if (['image', 'media', 'stylesheet', 'font'].includes(details.resourceType)) {
        callback({});
        return;
      }

      const url = new URL(details.url);
      const referer = details.referrer || '';
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          // Apenas bloquear scripts de terceiros, não CSS ou outros recursos
          if (url.origin !== refererUrl.origin && details.resourceType === 'script') {
            // Registrar script bloqueado
            privacyStats.thirdPartyScriptsBlocked++;
            try {
              const domain = url.hostname;
              privacyStats.topTrackers[domain] = (privacyStats.topTrackers[domain] || 0) + 1;
            } catch (e) {
              // Ignorar erros
            }
            privacyStats.lastUpdated = new Date().toISOString();
            callback({ cancel: true });
            return;
          }
        } catch (e) {
          // Ignorar erros
        }
      }
      
      callback({});
    });
  }

  // HTTPS Only
  if (privacySettings.httpsOnly) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      if (details.url.startsWith('http://') && 
          !details.url.startsWith('http://localhost') &&
          !details.url.startsWith('http://127.0.0.1')) {
        callback({ redirectURL: details.url.replace('http://', 'https://') });
        return;
      }
      callback({});
    });
  }

  // Proteção contra fingerprinting e permissões
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    // SEMPRE permitir fullscreen para vídeos (YouTube, etc.) - PRIMEIRO CHECAR
    if (permission === 'fullscreen') {
      callback(true);
      return;
    }
    
    // Bloquear notificações
    if (permission === 'notifications' && privacySettings.disableNotifications) {
      callback(false);
      return;
    }

    // Bloquear geolocalização
    if (permission === 'geolocation' && privacySettings.disableGeolocation) {
      callback(false);
      return;
    }

    // Bloquear outros pedidos de permissão
    callback(false);
  });

  // Configurar Content Security Policy - Removido CSP restritivo que quebrava sites
  // O CSP padrão do Electron já oferece proteção adequada
  // Não sobrescrever CSP para permitir que sites funcionem corretamente
  // ses.webRequest.onHeadersReceived((details, callback) => {
  //   let csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
  //   
  //   if (privacySettings.blockFingerprinting) {
  //     csp += " worker-src 'self';";
  //   }

  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': [csp]
  //     }
  //   });
  // });
}

// Variáveis globais para controle de fullscreen (por janela)
const windowFullscreenState = new Map();

// Criar janela principal
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remover frame padrão do Windows para usar title bar customizada
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // CRÍTICO: Impede require(), fs, process, etc.
      contextIsolation: true,  // CRÍTICO: Isola código da página do Node.js
      sandbox: false, // Sandbox desabilitado apenas na janela principal (para React)
      enableRemoteModule: false, // CRÍTICO: Impede módulo remote (deprecated)
      webSecurity: true, // CRÍTICO: Proteções padrão do Chromium
      allowRunningInsecureContent: true, // Permitir conteúdo misto para alguns sites funcionarem
      experimentalFeatures: false,
      webviewTag: true // Habilitar explicitamente a tag webview
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0f0f0f'
  });

  // Carregar React em desenvolvimento ou produção
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Console ativo para debug
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist-electron/renderer/index.html'));
  }

  // Inicializar estado de fullscreen para esta janela
  windowFullscreenState.set(mainWindow, {
    isInFullscreen: false,
    wasMaximized: false
  });

  // Limpar dados ao fechar se configurado
  mainWindow.on('closed', () => {
    if (privacySettings.clearDataOnExit) {
      session.defaultSession.clearStorageData({
        storages: ['cookies', 'cache', 'localstorage', 'sessionstorage']
      });
    }
  });

  // Aplicar configurações de privacidade
  applyPrivacySettings();

  // Handler para fullscreen de webviews
  // O evento did-attach-webview é disparado quando um webview é anexado ao DOM
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    console.log('🔗 Webview anexado, configurando handlers de fullscreen...');
    
    // Configurar handlers de fullscreen para este webview específico
    webContents.on('enter-html-full-screen', () => {
      console.log('📺 Webview entrando em fullscreen (via did-attach-webview handler)');
      const state = windowFullscreenState.get(mainWindow) || { isInFullscreen: false, wasMaximized: false };
      if (!state.isInFullscreen) {
        state.isInFullscreen = true;
        state.wasMaximized = mainWindow.isMaximized();
        windowFullscreenState.set(mainWindow, state);
        mainWindow.setFullScreen(true);
        mainWindow.webContents.send('fullscreen-changed', { isFullscreen: true });
        console.log('✅ Fullscreen ativado');
      }
    });

    webContents.on('leave-html-full-screen', () => {
      console.log('🚪 Webview saindo de fullscreen (via did-attach-webview handler)');
      const state = windowFullscreenState.get(mainWindow);
      if (state && state.isInFullscreen) {
        state.isInFullscreen = false;
        windowFullscreenState.set(mainWindow, state);
        mainWindow.setFullScreen(false);
        if (state.wasMaximized && !mainWindow.isMaximized()) {
          mainWindow.maximize();
        }
        mainWindow.webContents.send('fullscreen-changed', { isFullscreen: false });
        console.log('✅ Fullscreen desativado');
      }
    });
  });
  

  // Injetar proteções contra fingerprinting
  mainWindow.webContents.on('did-finish-load', () => {
    if (privacySettings.blockFingerprinting) {
      mainWindow.webContents.executeJavaScript(`
        // Desabilitar WebGL se configurado
        ${privacySettings.disableWebGL ? `
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) return 'Intel Inc.';
          if (parameter === 37446) return 'Intel Iris OpenGL Engine';
          return getParameter.apply(this, arguments);
        };` : ''}

        // Proteção de Canvas
        ${privacySettings.disableCanvas ? `
        const toBlob = HTMLCanvasElement.prototype.toBlob;
        const toDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toBlob = function() { return null; };
        HTMLCanvasElement.prototype.toDataURL = function() { return ''; };` : ''}

        // Proteção de Web Audio
        ${privacySettings.disableWebAudio ? `
        const createAnalyser = AudioContext.prototype.createAnalyser;
        AudioContext.prototype.createAnalyser = function() {
          const analyser = createAnalyser.apply(this, arguments);
          const getFloatFrequencyData = analyser.getFloatFrequencyData;
          analyser.getFloatFrequencyData = function() {
            getFloatFrequencyData.apply(this, arguments);
            for (let i = 0; i < arguments[0].length; i++) {
              arguments[0][i] = 0;
            }
          };
          return analyser;
        };` : ''}

        // Modificar navigator properties
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 4
        });
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8
        });
        Object.defineProperty(navigator, 'platform', {
          get: () => 'Win32'
        });
      `);
    }
  });

  return mainWindow;
}

// Eventos do app
app.whenReady().then(() => {
  // Configurar handlers de download primeiro
  setupDownloadHandlers();
  
  const mainWindow = createWindow();

  // Criar menu
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Nova Aba',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('new-tab');
          }
        },
        {
          label: 'Fechar Aba',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.webContents.send('close-tab');
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Privacidade',
      submenu: [
        {
          label: 'Configurações de Privacidade',
          click: () => {
            mainWindow.webContents.send('open-privacy-settings');
          }
        },
        {
          label: 'Limpar Dados de Navegação',
          click: () => {
            session.defaultSession.clearStorageData();
            mainWindow.webContents.send('show-message', 'Dados limpos com sucesso!');
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  // Remover menu padrão do Windows - usar title bar customizada
  if (process.platform === 'win32' || process.platform === 'linux') {
    Menu.setApplicationMenu(null);
  } else {
    // macOS mantém menu no topo da tela
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-privacy-settings', () => {
  return privacySettings;
});

ipcMain.handle('set-privacy-settings', (event, settings) => {
  privacySettings = { ...privacySettings, ...settings };
  store.set('privacySettings', privacySettings);
  
  // Reaplicar configurações de privacidade na sessão padrão
  applyPrivacySettings();
  
  // Reaplicar configurações em todas as sessões isoladas
  isolatedSessions.forEach((tabSession, tabId) => {
    applyPrivacySettingsToSession(tabSession);
  });
  
  return privacySettings;
});

ipcMain.handle('clear-all-data', () => {
  session.defaultSession.clearStorageData({
    storages: ['cookies', 'cache', 'localstorage', 'sessionstorage', 'filesystem']
  });
  return true;
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// Handlers para controle da janela (minimizar, maximizar, fechar)
ipcMain.handle('window-minimize', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.minimize();
});

ipcMain.handle('window-maximize', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.close();
});

ipcMain.handle('window-is-maximized', () => {
  const window = BrowserWindow.getFocusedWindow();
  return window ? window.isMaximized() : false;
});

// Handlers para fullscreen (modo de tela cheia de vídeos)
ipcMain.handle('enter-fullscreen', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    const state = windowFullscreenState.get(window) || { isInFullscreen: false, wasMaximized: false };
    if (!state.isInFullscreen) {
      state.isInFullscreen = true;
      state.wasMaximized = window.isMaximized();
      windowFullscreenState.set(window, state);
      
      // Entrar em modo fullscreen
      window.setFullScreen(true);
      
      // Notificar renderer para esconder UI
      window.webContents.send('fullscreen-changed', { isFullscreen: true });
      
      return { success: true };
    }
  }
  return { success: false };
});

ipcMain.handle('leave-fullscreen', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    const state = windowFullscreenState.get(window);
    if (state && state.isInFullscreen) {
      state.isInFullscreen = false;
      windowFullscreenState.set(window, state);
      
      // Sair de modo fullscreen
      window.setFullScreen(false);
      
      // Restaurar estado maximizado se estava antes
      if (state.wasMaximized && !window.isMaximized()) {
        window.maximize();
      }
      
      // Notificar renderer para restaurar UI
      window.webContents.send('fullscreen-changed', { isFullscreen: false });
      
      return { success: true };
    }
  }
  return { success: false };
});

// ========== HANDLERS PARA FAVORITOS ==========
ipcMain.handle('favorites-add', async (event, { title, url, favicon }) => {
  try {
    const result = await db.insertFavorite(title, url, favicon || null);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('favorites-remove', async (event, id) => {
  try {
    await db.deleteFavorite(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('favorites-remove-by-url', async (event, url) => {
  try {
    await db.deleteFavoriteByUrl(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('favorites-get-all', async () => {
  try {
    return await db.getAllFavorites();
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return [];
  }
});

ipcMain.handle('favorites-check', async (event, url) => {
  try {
    const favorite = await db.getFavorite(url);
    return favorite ? { isFavorite: true, favorite } : { isFavorite: false };
  } catch (error) {
    return { isFavorite: false };
  }
});

// ========== HANDLERS PARA HISTÓRICO ==========
ipcMain.handle('history-add', async (event, { title, url, favicon }) => {
  try {
    await db.insertHistory(title, url, favicon || null);
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar ao histórico:', error);
    return { success: false };
  }
});

ipcMain.handle('history-update-title', async (event, { url, title }) => {
  try {
    await db.updateHistoryTitle(url, title);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar título do histórico:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('history-update-favicon', async (event, { url, favicon }) => {
  try {
    await db.updateHistoryFavicon(url, favicon);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar favicon do histórico:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('history-get', async (event, { limit = 50, offset = 0 }) => {
  try {
    return await db.getHistory(limit, offset);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
});

ipcMain.handle('history-search', async (event, query, limit = 20) => {
  try {
    return await db.searchHistory(query, limit);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
});

ipcMain.handle('history-delete', async (event, id) => {
  try {
    await db.deleteHistory(id);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

ipcMain.handle('history-clear', async () => {
  try {
    await db.clearHistory();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

ipcMain.handle('history-delete-old', async (event, days = 30) => {
  try {
    await db.deleteOldHistory(days);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

// ========== HANDLERS PARA DOWNLOADS ==========
const downloads = new Map();

ipcMain.handle('download-start', async (event, { url, filename }) => {
  try {
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    const downloadPath = path.join(app.getPath('downloads'), filename);
    
    // Registrar download no banco
    const result = await db.insertDownload(filename, url, downloadPath, null, 'downloading');
    const downloadId = result.lastInsertRowid;
    
    downloads.set(downloadId, {
      id: downloadId,
      filename,
      url,
      path: downloadPath,
      status: 'downloading'
    });

    // Iniciar download via Electron
    mainWindow.webContents.downloadURL(url);
    
    return { success: true, downloadId };
  } catch (error) {
    console.error('Erro ao iniciar download:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('downloads-get-all', async (event, { limit = 50, offset = 0 }) => {
  try {
    return await db.getAllDownloads(limit, offset);
  } catch (error) {
    console.error('Erro ao buscar downloads:', error);
    return [];
  }
});

ipcMain.handle('download-delete', async (event, id) => {
  try {
    await db.deleteDownload(id);
    downloads.delete(id);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

ipcMain.handle('downloads-clear-completed', async () => {
  try {
    await db.clearCompletedDownloads();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

// ========== GERENCIAMENTO DE SESSÕES ISOLADAS POR ABA ==========
const isolatedSessions = new Map(); // Map<tabId, Session>

function createIsolatedSession(tabId) {
  // Criar sessão isolada usando partition única por aba
  // persist: significa que os dados são persistidos, mas isolados por aba
  const partition = `persist:tab-${tabId}`;
  const tabSession = session.fromPartition(partition, { cache: true });
  
  // Aplicar configurações de privacidade na sessão isolada
  applyPrivacySettingsToSession(tabSession);
  
  // Registrar handler de download também para esta sessão
  registerDownloadHandler(tabSession);
  
  isolatedSessions.set(tabId, tabSession);
  
  console.log(`🔒 Sessão isolada criada para aba ${tabId}`);
  
  return tabSession;
}

function destroyIsolatedSession(tabId) {
  const tabSession = isolatedSessions.get(tabId);
  if (tabSession) {
    // Limpar todos os dados da sessão
    tabSession.clearStorageData({
      storages: ['cookies', 'cache', 'localstorage', 'sessionstorage', 'indexdb', 'websql']
    });
    
    // Limpar cache
    tabSession.clearCache().then(() => {
      console.log(`🗑️ Sessão isolada ${tabId} limpa e destruída`);
    });
    
    isolatedSessions.delete(tabId);
  }
}

function getIsolatedSession(tabId) {
  if (!isolatedSessions.has(tabId)) {
    return createIsolatedSession(tabId);
  }
  return isolatedSessions.get(tabId);
}

// Aplicar configurações de privacidade em uma sessão específica
function applyPrivacySettingsToSession(ses) {
  // Mesma lógica de applyPrivacySettings, mas para uma sessão específica
  const settings = privacySettings;
  
  // Bloquear rastreadores e anúncios
  if (settings.blockTrackers || settings.blockAds) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url.toLowerCase();
      
      // Lista expandida de domínios de rastreamento (baseada em EasyList/EasyPrivacy)
      const trackerDomains = [
        // Google
        'doubleclick.net',
        'googleadservices.com',
        'googlesyndication.com',
        'google-analytics.com',
        'googletagmanager.com',
        'googletagservices.com',
        'googleadapis.com',
        'google-analytics.com',
        'googlesyndication.com',
        'gstatic.com/analytics',
        'google.com/ads',
        'google.com/analytics',
        // Facebook
        'facebook.com/tr',
        'facebook.com/connect',
        'facebook.net',
        'facebookads.com',
        'fbcdn.net',
        'fb.com',
        // Amazon
        'amazon-adsystem.com',
        'amazon.com/ads',
        'assoc-amazon.com',
        // Microsoft
        'bing.com/maps',
        'live.com/analytics',
        'microsoftadvertising.com',
        'msads.net',
        // Adobe
        'omniture.com',
        '2o7.net',
        'adobe.com/analytics',
        'demdex.net',
        // Outros rastreadores comuns
        'scorecardresearch.com',
        'quantserve.com',
        'advertising.com',
        'adsafeprotected.com',
        'moatads.com',
        'outbrain.com',
        'taboola.com',
        'adnxs.com',
        'rubiconproject.com',
        'pubmatic.com',
        'openx.net',
        'criteo.com',
        'bluekai.com',
        'crwdcntrl.net',
        'rlcdn.com',
        'serving-sys.com',
        'adform.com',
        'casalemedia.com',
        'adtechus.com',
        'media.net',
        'adfox.ru',
        'amazon-adsystem.com',
        'adsrvr.org',
        'adtechus.com',
        'brealtime.com',
        'chartbeat.com',
        'clicktale.net',
        'crazyegg.com',
        'hotjar.com',
        'mixpanel.com',
        'segment.io',
        'segment.com',
        'newrelic.com',
        'optimizely.com',
        'uservoice.com',
        'zendesk.com',
        'pardot.com',
        'marketo.com',
        'hubspot.com/analytics',
        'salesforce.com/analytics',
        'adroll.com',
        'klaviyo.com',
        'mailchimp.com/track',
        'marketo.net',
        'pardot.com',
        'salesforce.com/api',
        // CDNs de anúncios
        'cdnjs.cloudflare.com/ajax/libs/analytics',
        'cdn.ampproject.org/rtv',
        // Rastreadores de terceiros comuns
        'sharethrough.com',
        'teads.tv',
        'yieldmo.com',
        '33across.com',
        'contextweb.com',
        'districtm.io',
        'freewheel.tv',
        'indexexchange.com',
        'lockerdome.com',
        'sonobi.com',
        'synacor.com',
        'tremorhub.com',
        'triplelift.com',
        'video.unrulymedia.com',
        'w55c.net'
      ];

      // Padrões comuns de URLs de rastreadores/anúncios
      const trackerPatterns = [
        '/analytics.js',
        '/analytics.min.js',
        '/gtm.js',
        '/gtag.js',
        '/ga.js',
        '/gaq.js',
        '/facebook.js',
        '/facebook-pixel',
        '/pixel.js',
        '/tracking.js',
        '/track.js',
        '/beacon',
        '/click',
        '/impression',
        '/event',
        '/collect',
        '/pageview',
        '/ads.js',
        '/advertisement.js',
        '/advertising.js',
        '/banner.js',
        '/adsense',
        '/adserving',
        '/adservice',
        '/adsystem',
        '/tracker',
        '/tracking',
        '/analytics',
        '/metrics',
        '/stats',
        '/pixel',
        '/beacon'
      ];

      // Não bloquear imagens, vídeos, CSS ou fontes (exceto se for claramente rastreador)
      if (['stylesheet', 'font'].includes(details.resourceType)) {
        callback({});
        return;
      }

      // Verificar se é domínio de rastreador
      const isTrackerDomain = trackerDomains.some(domain => url.includes(domain));
      
      // Verificar se URL contém padrões de rastreadores
      const hasTrackerPattern = trackerPatterns.some(pattern => url.includes(pattern));
      
      // Verificar se é script de analytics/tracking
      const isTrackingScript = details.resourceType === 'script' && (
        url.includes('analytics') ||
        url.includes('tracking') ||
        url.includes('tracker') ||
        url.includes('pixel') ||
        url.includes('beacon') ||
        url.includes('gtm') ||
        url.includes('gtag') ||
        url.includes('facebook-pixel') ||
        url.includes('facebook.com/tr') ||
        url.includes('doubleclick')
      );

      const isTracker = isTrackerDomain || (isTrackingScript && details.resourceType === 'script');
      const isAd = hasTrackerPattern || isTrackerDomain;

      if ((settings.blockTrackers && isTracker && details.resourceType !== 'image' && details.resourceType !== 'media') || 
          (settings.blockAds && isAd && details.resourceType !== 'image' && details.resourceType !== 'media')) {
        // Registrar estatística (mesma lógica da sessão padrão)
        try {
          const urlObj = new URL(details.url);
          const domain = urlObj.hostname;
          
          if (settings.blockTrackers && isTracker) {
            privacyStats.trackersBlocked++;
            privacyStats.topTrackers[domain] = (privacyStats.topTrackers[domain] || 0) + 1;
          }
          
          if (settings.blockAds && isAd) {
            privacyStats.adsBlocked++;
            privacyStats.topTrackers[domain] = (privacyStats.topTrackers[domain] || 0) + 1;
          }
          
          privacyStats.lastUpdated = new Date().toISOString();
        } catch (e) {
          // Ignorar erros
        }
        
        callback({ cancel: true });
        return;
      }

      callback({});
    });
  }

  // Bloquear cookies de terceiros
  if (settings.blockThirdPartyCookies) {
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = new URL(details.url);
      const referer = details.requestHeaders.Referer || '';
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          if (url.origin !== refererUrl.origin) {
            delete details.requestHeaders.Cookie;
            privacyStats.thirdPartyCookiesBlocked++;
            privacyStats.lastUpdated = new Date().toISOString();
          }
        } catch (e) {
          delete details.requestHeaders.Cookie;
          privacyStats.thirdPartyCookiesBlocked++;
          privacyStats.lastUpdated = new Date().toISOString();
        }
      }
      
      if (settings.doNotTrack) {
        details.requestHeaders['DNT'] = '1';
      }

      callback({ requestHeaders: details.requestHeaders });
    });
  }

  // Bloquear scripts de terceiros
  if (settings.blockThirdPartyScripts) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      if (['image', 'media', 'stylesheet', 'font'].includes(details.resourceType)) {
        callback({});
        return;
      }

      const url = new URL(details.url);
      const referer = details.referrer || '';
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          if (url.origin !== refererUrl.origin && details.resourceType === 'script') {
            privacyStats.thirdPartyScriptsBlocked++;
            try {
              const domain = url.hostname;
              privacyStats.topTrackers[domain] = (privacyStats.topTrackers[domain] || 0) + 1;
            } catch (e) {
              // Ignorar erros
            }
            privacyStats.lastUpdated = new Date().toISOString();
            callback({ cancel: true });
            return;
          }
        } catch (e) {
          // Ignorar erros
        }
      }
      
      callback({});
    });
  }

  // HTTPS Only
  if (settings.httpsOnly) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      if (details.url.startsWith('http://') && 
          !details.url.startsWith('http://localhost') &&
          !details.url.startsWith('http://127.0.0.1')) {
        callback({ redirectURL: details.url.replace('http://', 'https://') });
        return;
      }
      callback({});
    });
  }

  // Proteção contra fingerprinting e permissões
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    // Permitir fullscreen para vídeos (YouTube, etc.)
    if (permission === 'fullscreen') {
      callback(true);
      return;
    }
    
    if (permission === 'notifications' && settings.disableNotifications) {
      callback(false);
      return;
    }
    if (permission === 'geolocation' && settings.disableGeolocation) {
      callback(false);
      return;
    }
    callback(false);
  });
}

// IPC handlers para gerenciar sessões isoladas
ipcMain.handle('get-isolated-session', (event, tabId) => {
  const session = getIsolatedSession(tabId);
  return { partition: `persist:tab-${tabId}` };
});

ipcMain.handle('destroy-isolated-session', (event, tabId) => {
  destroyIsolatedSession(tabId);
  return { success: true };
});

// IPC handlers para gerenciar temas
ipcMain.handle('get-theme', (event) => {
  return store.get('theme', {
    name: 'dark',
    colors: {
      bgPrimary: '#1c1c1e',
      bgSecondary: '#2c2c2e',
      bgTertiary: '#3a3a3c',
      bgHover: '#48484a',
      textPrimary: '#ffffff',
      textSecondary: '#98989d',
      textTertiary: '#636366',
      accent: '#007aff',
      accentHover: '#5ac8fa',
      border: 'rgba(255, 255, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      danger: '#ff3b30',
      success: '#34c759',
      warning: '#ff9500'
    }
  });
});

ipcMain.handle('set-theme', (event, theme) => {
  store.set('theme', theme);
  return { success: true };
});

// IPC handler para obter caminho do ícone (retorna como base64 data URL)
ipcMain.handle('get-icon-path', () => {
  // Tentar diferentes caminhos possíveis
  let iconPath;
  
  // Em produção (packaged)
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
    // Se não encontrar, tentar __dirname
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(__dirname, 'assets', 'icon.png');
    }
  } else {
    // Em desenvolvimento
    iconPath = path.join(__dirname, 'assets', 'icon.png');
    // Se não encontrar, tentar caminho relativo ao projeto
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(process.cwd(), 'assets', 'icon.png');
    }
  }
  
  // Se não encontrou, retornar caminho relativo para o renderer tentar carregar
  if (!fs.existsSync(iconPath)) {
    console.warn('⚠️ Arquivo icon.png não encontrado em:', iconPath);
    return '/assets/icon.png'; // Fallback para caminho relativo
  }
  
  try {
    // Ler o arquivo e converter para base64 data URL
    const imageBuffer = fs.readFileSync(iconPath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Erro ao ler icon.png:', error);
    // Fallback para caminho relativo
    return '/assets/icon.png';
  }
});

// IPC handlers para estatísticas de privacidade
ipcMain.handle('get-privacy-stats', (event) => {
  // Converter topTrackers object em array ordenado
  const topTrackersArray = Object.entries(privacyStats.topTrackers || {})
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    trackersBlocked: privacyStats.trackersBlocked || 0,
    adsBlocked: privacyStats.adsBlocked || 0,
    thirdPartyCookiesBlocked: privacyStats.thirdPartyCookiesBlocked || 0,
    thirdPartyScriptsBlocked: privacyStats.thirdPartyScriptsBlocked || 0,
    topTrackers: topTrackersArray,
    lastUpdated: privacyStats.lastUpdated || new Date().toISOString()
  };
});

ipcMain.handle('reset-privacy-stats', (event) => {
  privacyStats = {
    trackersBlocked: 0,
    adsBlocked: 0,
    thirdPartyCookiesBlocked: 0,
    thirdPartyScriptsBlocked: 0,
    topTrackers: {},
    lastUpdated: new Date().toISOString()
  };
  store.set('privacyStats', privacyStats);
  return { success: true };
});

// ========== HANDLERS PARA CRIPTOGRAFIA ==========
ipcMain.handle('encryption-get-status', () => {
  try {
    return {
      success: true,
      enabled: cryptoUtils.isEncryptionEnabled()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('encryption-set-enabled', async (event, enabled) => {
  try {
    cryptoUtils.setEncryptionEnabled(enabled);
    
    // Se habilitando pela primeira vez, re-criptografar dados existentes
    if (enabled) {
      console.log('🔐 Criptografia habilitada - os novos dados serão criptografados');
      // Nota: Dados existentes continuarão descriptografados até serem atualizados
      // Uma migração completa pode ser feita se necessário
    } else {
      console.log('⚠️ Criptografia desabilitada');
    }
    
    return { success: true, enabled };
  } catch (error) {
    console.error('Erro ao alterar status de criptografia:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('encryption-re-encrypt-all', async () => {
  try {
    if (!cryptoUtils.isEncryptionEnabled()) {
      return { success: false, message: 'Criptografia não está habilitada' };
    }
    
    // Re-criptografar todos os favoritos
    const favorites = await db.getAllFavorites();
    for (const fav of favorites) {
      await db.insertFavorite(fav.title, fav.url, fav.favicon);
    }
    
    // Re-criptografar todo o histórico (limitado a 1000 para não travar)
    const history = await db.getHistory(1000, 0);
    for (const item of history) {
      await db.insertHistory(item.title, item.url, item.favicon);
    }
    
    return { success: true, message: 'Todos os dados foram re-criptografados' };
  } catch (error) {
    console.error('Erro ao re-criptografar dados:', error);
    return { success: false, error: error.message };
  }
});

// Listener global para capturar todos os downloads (inclusive de webviews)
let downloadHandlerSetup = false;

function registerDownloadHandler(sessionToUse) {
  // Remover listeners anteriores se existirem (não há método direto, então verificamos)
  sessionToUse.on('will-download', async (event, item, webContents) => {
    console.log('🔄 Download iniciado!', item.getFilename());
    
    const filename = item.getFilename();
    let totalBytes = item.getTotalBytes();
    const url = item.getURLChain()[0] || item.getURL();
    const savePath = path.join(app.getPath('downloads'), filename);
    
    console.log('📥 Download:', { filename, totalBytes, url });
    
    item.setSavePath(savePath);
    
    // Verificar se já existe um download registrado (download manual)
    let download = null;
    let downloadId = null;
    const allDownloads = await db.getAllDownloads(1000, 0);
    download = allDownloads.find(d => d.filename === filename && d.url === url);
    
    // Se não existe, criar um novo registro (download automático de link/clique)
    if (!download) {
      try {
        const result = await db.insertDownload(filename, url, savePath, totalBytes || 0, 'downloading');
        downloadId = result.lastInsertRowid;
        
        // Buscar o download recém-criado
        download = await db.getDownload(downloadId);
        
        // Notificar a janela principal sobre o novo download
        console.log('✅ Download registrado no banco com ID:', downloadId);
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(win => {
          console.log('📤 Enviando evento download-started:', { id: downloadId, filename, url });
          win.webContents.send('download-started', { id: downloadId, filename, url });
        });
      } catch (error) {
        console.error('Erro ao registrar download:', error);
        // Continuar mesmo se não conseguir registrar no banco
      }
    } else {
      downloadId = download.id;
    }

    // Atualizar total_bytes se necessário e se ainda não tinha
    if (downloadId && totalBytes && totalBytes > 0) {
      await db.updateDownload(
        download ? download.received_bytes || 0 : 0, 
        'downloading', 
        null, 
        null, 
        null, 
        downloadId,
        totalBytes
      );
      download = await db.getDownload(downloadId);
    }

    // Armazenar referência do download ID para uso nos eventos
    const finalDownloadId = downloadId || download?.id;
    
    if (!finalDownloadId) {
      console.error('Download ID não encontrado para:', filename);
      return;
    }

    item.on('updated', async (event, state) => {
      // Buscar dados atualizados do banco
      const currentDownload = await db.getDownload(finalDownloadId);
      if (!currentDownload) return;
      
      // Atualizar totalBytes se ainda não estava disponível
      if (!totalBytes || totalBytes === 0) {
        totalBytes = item.getTotalBytes();
        if (totalBytes && totalBytes > 0) {
          await db.updateDownload(
            item.getReceivedBytes(),
            'downloading',
            null,
            null,
            null,
            finalDownloadId,
            totalBytes
          );
        }
      }
      
      if (state === 'interrupted') {
        await db.updateDownload(
          item.getReceivedBytes(), 
          'interrupted', 
          'Download interrompido', 
          null, 
          null, 
          finalDownloadId
        );
        
        // Notificar janela principal
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(win => {
          win.webContents.send('download-progress', {
            id: finalDownloadId,
            received: item.getReceivedBytes(),
            total: totalBytes || 0,
            percent: 0,
            status: 'interrupted'
          });
        });
      } else if (state === 'progressing') {
        const received = item.getReceivedBytes();
        const currentTotal = item.getTotalBytes() || totalBytes || 0;
        const percent = currentTotal > 0 
          ? parseFloat(((received / currentTotal) * 100).toFixed(2))
          : 0;
        
        console.log(`📊 Progresso: ${percent}% (${received}/${currentTotal})`);
        
        await db.updateDownload(
          received, 
          'downloading', 
          null, 
          null, 
          null, 
          finalDownloadId,
          currentTotal > 0 ? currentTotal : null
        );
        
        // Notificar progresso para todas as janelas (enviar sempre, mesmo que seja 0%)
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(win => {
          const progressData = {
            id: finalDownloadId,
            received: received,
            total: currentTotal,
            percent: percent
          };
          console.log('📤 Enviando progresso:', progressData);
          win.webContents.send('download-progress', progressData);
        });
      }
    });

    item.on('done', async (event, state) => {
      if (finalDownloadId) {
        if (state === 'completed') {
          await db.updateDownload(
            item.getReceivedBytes(),
            'completed',
            null,
            new Date().toISOString(),
            null,
            finalDownloadId
          );
          
          // Notificar todas as janelas
          const windows = BrowserWindow.getAllWindows();
          windows.forEach(win => {
            win.webContents.send('download-completed', { id: finalDownloadId });
          });
        } else if (state === 'cancelled') {
          await db.updateDownload(
            item.getReceivedBytes(),
            'cancelled',
            'Download cancelado',
            null,
            null,
            finalDownloadId
          );
          
          // Notificar cancelamento
          const windows = BrowserWindow.getAllWindows();
          windows.forEach(win => {
            win.webContents.send('download-progress', {
              id: finalDownloadId,
              received: item.getReceivedBytes(),
              total: totalBytes || 0,
              percent: 0,
              status: 'cancelled'
            });
          });
        }
      }
    });
  });
}

function setupDownloadHandlers() {
  // Evitar registrar múltiplas vezes
  if (downloadHandlerSetup) return;
  downloadHandlerSetup = true;
  
  // Registrar handlers de download para a sessão padrão
  const defaultSession = session.defaultSession;
  registerDownloadHandler(defaultSession);
  
  // Sessões isoladas terão handlers registrados automaticamente quando criadas
}
