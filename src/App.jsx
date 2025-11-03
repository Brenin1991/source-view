import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Toolbar from './components/Toolbar';
import Tabs from './components/Tabs';
import WebViewContainer from './components/WebViewContainer';
import HomePage from './components/HomePage';
import ErrorPage from './components/ErrorPage';
import SettingsModal from './components/SettingsModal';
import AboutModal from './components/AboutModal';
import FavoritesModal from './components/FavoritesModal';
import HistoryModal from './components/HistoryModal';
import DownloadsModal from './components/DownloadsModal';
import PrivacyReportModal from './components/PrivacyReportModal';
import { useTabs } from './hooks/useTabs';
import { usePrivacySettings } from './hooks/usePrivacySettings';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const {
    tabs,
    activeTabId,
    errors,
    createTab,
    closeTab,
    switchTab,
    navigateTab,
    goBack,
    goForward,
    reloadTab,
    stopLoading,
    updateTabTitle,
    updateTabUrl,
    updateTabFavicon,
    setTabError,
    clearTabError
  } = useTabs();

  const { privacySettings, loadSettings, saveSettings, clearAllData } = usePrivacySettings();
  useTheme(); // Aplicar tema
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [showPrivacyReportModal, setShowPrivacyReportModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHomePage, setShowHomePage] = useState(true);
  const [activeDownloadsCount, setActiveDownloadsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Calcular activeTab primeiro para poder usar nos useEffects
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Inicializar com uma aba na primeira renderização
  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
      setShowHomePage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSettings();

    // Listeners IPC
    if (window.electronAPI) {
      window.electronAPI.onNewTab(() => {
        createTab();
        setShowHomePage(true);
      });

      window.electronAPI.onCloseTab(() => {
        if (activeTabId !== null) {
          closeTab(activeTabId);
        }
      });

      window.electronAPI.onOpenPrivacySettings(() => {
        setShowPrivacyModal(true);
      });

      window.electronAPI.onShowAbout(() => {
        setShowAboutModal(true);
      });

      return () => {
        window.electronAPI?.removeAllListeners('new-tab');
        window.electronAPI?.removeAllListeners('close-tab');
        window.electronAPI?.removeAllListeners('open-privacy-settings');
        window.electronAPI?.removeAllListeners('show-about');
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escutar eventos de fullscreen
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFullscreenChanged) {
      const handleFullscreenChange = (event, data) => {
        setIsFullscreen(data.isFullscreen);
      };
      
      window.electronAPI.onFullscreenChanged(handleFullscreenChange);
      
      return () => {
        if (window.electronAPI && window.electronAPI.removeAllListeners) {
          window.electronAPI.removeAllListeners('fullscreen-changed');
        }
      };
    }
  }, []);

  // Verificar se URL atual é favorita
  useEffect(() => {
    const checkFavorite = async () => {
      if (activeTab && activeTab.url && activeTab.url !== 'about:blank' && window.electronAPI) {
        try {
          const result = await window.electronAPI.favoritesCheck(activeTab.url);
          setIsFavorite(result.isFavorite);
        } catch (error) {
          console.error('Erro ao verificar favorito:', error);
        }
      } else {
        setIsFavorite(false);
      }
    };
    checkFavorite();
  }, [activeTab]);

  // Monitorar downloads ativos
  useEffect(() => {
    const updateActiveDownloads = async () => {
      if (window.electronAPI) {
        try {
          const allDownloads = await window.electronAPI.downloadsGetAll({ limit: 1000 });
          const active = allDownloads.filter(d => d.status === 'downloading');
          setActiveDownloadsCount(active.length);
        } catch (error) {
          console.error('Erro ao buscar downloads:', error);
        }
      }
    };

    // Atualizar quando modal de downloads é aberto
    if (showDownloadsModal) {
      updateActiveDownloads();
    }

    // Escutar eventos de download
    if (window.electronAPI) {
      const handleDownloadStarted = () => {
        updateActiveDownloads();
      };

      const handleDownloadProgress = () => {
        updateActiveDownloads();
      };

      const handleDownloadCompleted = () => {
        updateActiveDownloads();
      };

      window.electronAPI.onDownloadStarted(handleDownloadStarted);
      window.electronAPI.onDownloadProgress(handleDownloadProgress);
      window.electronAPI.onDownloadCompleted(handleDownloadCompleted);

      // Atualizar periodicamente também
      const interval = setInterval(updateActiveDownloads, 2000);

      return () => {
        window.electronAPI?.removeAllListeners('download-started');
        window.electronAPI?.removeAllListeners('download-progress');
        window.electronAPI?.removeAllListeners('download-completed');
        clearInterval(interval);
      };
    }
  }, [showDownloadsModal]);

  const handleNavigate = (url) => {
    if (activeTabId !== null) {
      clearTabError(activeTabId);
      navigateTab(activeTabId, url);
      setShowHomePage(false);
    } else {
      const newTab = createTab(url);
      setShowHomePage(false);
    }
  };

  const handleAddressBarSubmit = (url) => {
    handleNavigate(url);
  };

  const handleFavoriteToggle = async () => {
    if (!activeTab || !activeTab.url || activeTab.url === 'about:blank' || !window.electronAPI) return;
    
    try {
      if (isFavorite) {
        await window.electronAPI.favoritesRemoveByUrl(activeTab.url);
        setIsFavorite(false);
      } else {
        await window.electronAPI.favoritesAdd({
          title: activeTab.title || activeTab.url,
          url: activeTab.url,
          favicon: activeTab.favicon || null
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  };

  const handleNewTab = () => {
    const newTab = createTab();
    setShowHomePage(true);
    switchTab(newTab.id);
  };

  return (
    <div className={`browser-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && <TitleBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={switchTab}
        onTabClose={closeTab}
        onNewTab={handleNewTab}
      />}
      
      {!isFullscreen && <Toolbar
        onNavigate={handleNavigate}
        onAddressBarSubmit={handleAddressBarSubmit}
        onBack={goBack}
        onForward={goForward}
        onReload={reloadTab}
        onStop={stopLoading}
        isLoading={isLoading}
        onPrivacyClick={() => setShowSettingsModal(true)}
        onFavoritesClick={() => setShowFavoritesModal(true)}
        onHistoryClick={() => setShowHistoryModal(true)}
        onDownloadsClick={() => setShowDownloadsModal(true)}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={isFavorite}
        currentUrl={activeTab?.url || ''}
        canGoBack={activeTab?.canGoBack || false}
        canGoForward={activeTab?.canGoForward || false}
        activeDownloadsCount={activeDownloadsCount}
      />}

      <div className="content-wrapper">
        <WebViewContainer
          tabs={tabs}
          activeTabId={activeTabId}
          hasError={!!errors[activeTabId]}
          onTitleUpdate={(tabId, title) => {
            updateTabTitle(tabId, title);
            // Atualizar título no histórico quando o título da página for atualizado
            if (title && window.electronAPI) {
              const tab = tabs.find(t => t.id === tabId);
              if (tab && tab.url && tab.url !== 'about:blank' && !tab.url.startsWith('about:')) {
                window.electronAPI.historyUpdateTitle({
                  url: tab.url,
                  title: title
                });
              }
            }
          }}
          onFaviconUpdate={(tabId, favicon) => {
            updateTabFavicon(tabId, favicon);
            // Atualizar favicon no histórico quando o favicon da página for atualizado
            if (favicon && window.electronAPI) {
              const tab = tabs.find(t => t.id === tabId);
              if (tab && tab.url && tab.url !== 'about:blank' && !tab.url.startsWith('about:')) {
                window.electronAPI.historyUpdateFavicon({
                  url: tab.url,
                  favicon: favicon
                });
              }
            }
          }}
          onUrlUpdate={(tabId, url) => {
            updateTabUrl(tabId, url);
            // Registrar no histórico (título será atualizado depois quando onTitleUpdate for chamado)
            if (url && url !== 'about:blank' && !url.startsWith('about:') && window.electronAPI) {
              const tab = tabs.find(t => t.id === tabId);
              if (tab) {
                // Usar URL como título temporário - será atualizado quando o título real chegar
                // Tentar usar favicon da tab se disponível
                window.electronAPI.historyAdd({
                  title: url, // Título temporário
                  url: url,
                  favicon: tab.favicon || null
                });
              }
            }
          }}
          onLoadingChange={(tabId, loading) => {
            if (tabId === activeTabId) {
              setIsLoading(loading);
            }
            if (tabId === activeTabId && !loading && !errors[activeTabId]) {
              // Esconder home page apenas se realmente carregou uma URL válida
              const tab = tabs.find(t => t.id === tabId);
              if (tab && tab.url && tab.url !== 'about:blank') {
                setShowHomePage(false);
              }
            }
          }}
          onError={setTabError}
        />

        {showHomePage && !errors[activeTabId] && (!activeTab || activeTab?.url === 'about:blank') && (
          <HomePage 
            onNavigate={handleNavigate}
            onOpenPrivacyReport={() => setShowPrivacyReportModal(true)}
          />
        )}
        
        {/* Página de erro - deve aparecer quando houver erro, mesmo se home page estiver false */}
        {errors[activeTabId] && activeTabId !== null && (
          <ErrorPage
            error={errors[activeTabId]}
            url={activeTab?.url || ''}
            onReload={() => {
              clearTabError(activeTabId);
              // Pequeno delay para garantir que o erro foi limpo antes de recarregar
              setTimeout(() => {
                reloadTab();
              }, 100);
            }}
            onGoHome={() => {
              clearTabError(activeTabId);
              setShowHomePage(true);
              if (activeTab) {
                navigateTab(activeTabId, 'about:blank');
              }
            }}
          />
        )}
      </div>

      {showSettingsModal && (
        <SettingsModal
          privacySettings={privacySettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={async (settings) => {
            await saveSettings(settings);
            setShowSettingsModal(false);
            window.location.reload();
          }}
          onClearData={clearAllData}
        />
      )}

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}

      {showFavoritesModal && (
        <FavoritesModal 
          onClose={() => setShowFavoritesModal(false)}
          onNavigate={handleNavigate}
        />
      )}

      {showHistoryModal && (
        <HistoryModal 
          onClose={() => setShowHistoryModal(false)}
          onNavigate={handleNavigate}
        />
      )}

      {showDownloadsModal && (
        <DownloadsModal 
          onClose={() => setShowDownloadsModal(false)}
        />
      )}

      {showPrivacyReportModal && (
        <PrivacyReportModal 
          onClose={() => setShowPrivacyReportModal(false)}
        />
      )}
    </div>
  );
}

export default App;

