import React, { useState, useEffect } from 'react';
import './Toolbar.css';

function Toolbar({ 
  onNavigate, 
  onAddressBarSubmit, 
  onBack, 
  onForward, 
  onReload,
  onStop,
  isLoading = false,
  onPrivacyClick,
  onFavoritesClick,
  onHistoryClick,
  onDownloadsClick,
  onFavoriteToggle,
  isFavorite,
  currentUrl,
  canGoBack,
  canGoForward,
  activeDownloadsCount = 0
}) {
  const [addressBarValue, setAddressBarValue] = useState('');

  useEffect(() => {
    setAddressBarValue(currentUrl === 'about:blank' ? '' : currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (addressBarValue.trim()) {
      onAddressBarSubmit(addressBarValue.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const getSecurityIcon = () => {
    if (!currentUrl || currentUrl === 'about:blank') return null;
    if (currentUrl.startsWith('https://')) {
      return (
        <div className="security-indicator" title="Conexão Segura (HTTPS)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      );
    } else if (currentUrl.startsWith('http://')) {
      return (
        <div className="security-indicator insecure" title="Conexão Insegura (HTTP)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="toolbar">
      <div className="nav-buttons">
        <div className="nav-controls">
          <button 
            className="nav-btn" 
            onClick={onBack}
            disabled={!canGoBack}
            title="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button 
            className="nav-btn" 
            onClick={onForward}
            disabled={!canGoForward}
            title="Avançar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button 
            className="nav-btn" 
            onClick={isLoading ? onStop : onReload}
            title={isLoading ? "Parar" : "Recarregar"}
          >
            {isLoading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="6" x2="18" y2="18"></line>
                <line x1="6" y1="18" x2="18" y2="6"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M21 3v5M21 8h-5M3 21v-5M3 16h5"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <form className="address-bar-container" onSubmit={handleSubmit}>
        {getSecurityIcon()}
        <input
          type="text"
          className="address-bar"
          value={addressBarValue}
          onChange={(e) => setAddressBarValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite um endereço ou pesquise..."
        />
        <button
          type="button"
          className={`toolbar-btn favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onFavoriteToggle}
          title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button
          type="button"
          className={`toolbar-btn downloads-btn ${activeDownloadsCount > 0 ? 'has-downloads' : ''}`}
          onClick={onDownloadsClick}
          title={activeDownloadsCount > 0 ? `${activeDownloadsCount} download(s) em progresso` : "Downloads"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {activeDownloadsCount > 0 && (
            <span className="downloads-badge">
              {activeDownloadsCount > 9 ? '9+' : activeDownloadsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onHistoryClick}
          title="Histórico"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onFavoritesClick}
          title="Favoritos"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button
          type="button"
          className="toolbar-btn privacy-btn"
          onClick={onPrivacyClick}
          title="Configurações"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default Toolbar;

