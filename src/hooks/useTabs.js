import { useState, useCallback } from 'react';

export function useTabs() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [errors, setErrors] = useState({}); // { tabId: errorObject }

  const createTab = useCallback((url = 'about:blank') => {
    const tabId = Date.now();
    const newTab = {
      id: tabId,
      url: url,
      title: 'Nova Aba',
      favicon: null,
      canGoBack: false,
      canGoForward: false,
      loading: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    return newTab;
  }, []);

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      
      // Se fechou a aba ativa, ativar outra
      if (tabId === activeTabId) {
        if (newTabs.length > 0) {
          setActiveTabId(newTabs[0].id);
        } else {
          setActiveTabId(null);
        }
      }
      
      return newTabs;
    });

    // Limpar erro da aba fechada
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[tabId];
      return newErrors;
    });
  }, [activeTabId]);

  const switchTab = useCallback((tabId) => {
    setActiveTabId(tabId);
    // Limpar erro ao trocar de aba
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[tabId];
      return newErrors;
    });
  }, []);

  const navigateTab = useCallback((tabId, url) => {
    // Limpar URL
    let finalUrl = url.trim();

    // Se não tiver protocolo, tratar como busca ou adicionar https://
    if (!finalUrl.match(/^https?:\/\//i)) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        // Buscar no DuckDuckGo
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, url: finalUrl } : tab
    ));

    // Atualizar webview - usar setTimeout para garantir que o DOM está atualizado
    setTimeout(() => {
      const webview = document.getElementById(`webview-${tabId}`);
      if (webview) {
        try {
          // Limpar erro antes de navegar
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[tabId];
            return newErrors;
          });
          webview.src = finalUrl;
          console.log('Navegando para:', finalUrl);
        } catch (error) {
          console.error('Erro ao navegar:', error);
        }
      } else {
        console.warn('Webview não encontrado para tab:', tabId);
      }
    }, 100);
  }, []);

  const goBack = useCallback(() => {
    if (activeTabId !== null) {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview && webview.canGoBack()) {
        webview.goBack();
      }
    }
  }, [activeTabId]);

  const goForward = useCallback(() => {
    if (activeTabId !== null) {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview && webview.canGoForward()) {
        webview.goForward();
      }
    }
  }, [activeTabId]);

  const reloadTab = useCallback(() => {
    if (activeTabId !== null) {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview) {
        webview.reload();
      }
    }
  }, [activeTabId]);

  const stopLoading = useCallback(() => {
    if (activeTabId !== null) {
      const webview = document.getElementById(`webview-${activeTabId}`);
      if (webview && webview.stop) {
        webview.stop();
      }
    }
  }, [activeTabId]);

  const updateTabTitle = useCallback((tabId, title) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, title } : tab
    ));
  }, []);

  const updateTabUrl = useCallback((tabId, url) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, url, favicon: null } : tab
    ));

    // Atualizar canGoBack/canGoForward
    const webview = document.getElementById(`webview-${tabId}`);
    if (webview) {
      setTabs(prev => prev.map(tab =>
        tab.id === tabId 
          ? { 
              ...tab, 
              canGoBack: webview.canGoBack(), 
              canGoForward: webview.canGoForward() 
            }
          : tab
      ));
    }
  }, []);

  const updateTabFavicon = useCallback((tabId, favicon) => {
    console.log('🔄 updateTabFavicon chamado para tab', tabId, 'com favicon:', favicon);
    if (favicon) {
      setTabs(prev => prev.map(tab =>
        tab.id === tabId ? { ...tab, favicon } : tab
      ));
    }
  }, []);

  const setTabError = useCallback((tabId, error) => {
    setErrors(prev => ({
      ...prev,
      [tabId]: error
    }));
  }, []);

  const clearTabError = useCallback((tabId) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[tabId];
      return newErrors;
    });
  }, []);

  return {
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
  };
}

