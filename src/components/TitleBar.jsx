import React, { useState, useEffect } from 'react';
import './TitleBar.css';
import './Tabs.css';

function TitleBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showTitleBar, setShowTitleBar] = useState(false);

  useEffect(() => {
    // Verificar se está em ambiente Electron
    const checkPlatform = async () => {
      if (window.electronAPI) {
        try {
          // Tentar verificar se está maximizado (só funciona no Electron)
          const maximized = await window.electronAPI.windowIsMaximized();
          setIsMaximized(maximized);
          setShowTitleBar(true);
        } catch (e) {
          setShowTitleBar(false);
        }
      } else {
        setShowTitleBar(false);
      }
    };

    checkPlatform();

    // Escutar mudanças de estado da janela
    const checkInterval = setInterval(async () => {
      if (window.electronAPI && showTitleBar) {
        try {
          const maximized = await window.electronAPI.windowIsMaximized();
          setIsMaximized(maximized);
        } catch (e) {
          // Ignorar erros
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [showTitleBar]);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.windowMinimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.windowMaximize().then(() => {
        window.electronAPI.windowIsMaximized().then(maximized => {
          setIsMaximized(maximized);
        });
      });
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.windowClose();
    }
  };

  if (!showTitleBar) {
    return null;
  }

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region">
        <div className="title-bar-tabs">
          {tabs && tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => onTabClick && onTabClick(tab.id)}
            >
              {tab.favicon ? (
                <img 
                  src={tab.favicon} 
                  alt="" 
                  className="tab-favicon"
                  onError={(e) => {
                    console.warn('❌ Erro ao carregar favicon:', tab.favicon, 'para tab', tab.id);
                    // Se falhar ao carregar o favicon, esconder a imagem e mostrar placeholder
                    e.target.style.display = 'none';
                    const placeholder = e.target.nextElementSibling;
                    if (placeholder && placeholder.classList.contains('tab-favicon-placeholder')) {
                      placeholder.style.display = 'flex';
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ Favicon carregado com sucesso:', tab.favicon);
                  }}
                />
              ) : null}
              <div className="tab-favicon-placeholder" style={{ display: tab.favicon ? 'none' : 'flex' }}></div>
              <span className="tab-title" title={tab.url || 'Nova Aba'}>
                {tab.title || 'Nova Aba'}
              </span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose && onTabClose(tab.id);
                }}
                title="Fechar aba"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
          <button className="tab-new" onClick={onNewTab} title="Nova aba">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className="title-bar-controls">
        <button className="title-bar-button minimize" onClick={handleMinimize} title="Minimizar">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M0 6h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="title-bar-button maximize" onClick={handleMaximize} title={isMaximized ? "Restaurar" : "Maximizar"}>
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 2h4v4H2V2zM6 6h4v4H6V6z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <button className="title-bar-button close" onClick={handleClose} title="Fechar">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
