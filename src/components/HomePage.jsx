import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import './HomePage.css';

function HomePage({ onNavigate, onOpenPrivacyReport }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [activeView, setActiveView] = useState('search'); // search, favorites, history
  const [privacyStats, setPrivacyStats] = useState(null);
  const [iconPath, setIconPath] = useState('/assets/icon.png');
  const { currentTheme } = useTheme();
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadFavorites();
    loadRecentHistory();
    loadPrivacyStats();
    loadIconPath();
    
    // Atualizar estatísticas periodicamente
    const statsInterval = setInterval(loadPrivacyStats, 3000);
    
    // Focar no input quando a página aparecer
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      clearInterval(statsInterval);
    };
  }, []);
  
  const loadIconPath = async () => {
    if (window.electronAPI) {
      try {
        const iconPathFromAPI = await window.electronAPI.getIconPath();
        if (iconPathFromAPI) {
          setIconPath(iconPathFromAPI);
        }
      } catch (error) {
        console.error('Erro ao carregar caminho do ícone:', error);
        // Fallback para caminho relativo
        setIconPath('/assets/icon.png');
      }
    }
  };

  const loadFavorites = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.favoritesGetAll();
        setFavorites(data.slice(0, 8)); // Top 8 favoritos
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      }
    }
  };

  const loadRecentHistory = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.historyGet({ limit: 8 });
        setRecentHistory(data);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  };

  const loadPrivacyStats = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getPrivacyStats();
        setPrivacyStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas de privacidade:', error);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(searchQuery);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Navegação por teclado pode ser implementada aqui
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSearch(e);
    }
  };

  const getDomainFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (minutes < 1) return 'Agora';
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const getTotalBlocked = () => {
    if (!privacyStats) return 0;
    return privacyStats.trackersBlocked + privacyStats.adsBlocked + 
           privacyStats.thirdPartyCookiesBlocked + privacyStats.thirdPartyScriptsBlocked;
  };

  // Gerar gradiente baseado no tema
  const getGradientColors = () => {
    const colors = currentTheme.colors;
    return `linear-gradient(-45deg, ${colors.bgPrimary}, ${colors.bgSecondary}, ${colors.bgTertiary}, ${colors.bgHover}, ${colors.bgPrimary})`;
  };

  return (
    <div 
      className="home-page" 
      style={{ background: getGradientColors() }}
      data-theme={currentTheme.name}
    >
      <div className="home-content">
        <div className="home-header">
          <div className="browser-brand">
            <div className="browser-logo">
              <img 
                src={iconPath}
                alt="Catnip Secure Browser" 
                className="logo-image"
                onError={(e) => {
                  // Se falhar, usar SVG placeholder
                  e.target.style.display = 'none';
                  const placeholder = e.target.nextElementSibling;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
              <div className="logo-placeholder" style={{ display: 'none' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <h1 className="browser-name">Catnip Secure Browser</h1>
          </div>
        </div>
        
        <div className="home-main">
          <form className="search-box" onSubmit={handleSearch}>
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Buscar ou digite uma URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </form>

          {privacyStats && (
            <div className="privacy-summary">
              <div className="privacy-summary-header">
                <div className="privacy-stat-card total">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{getTotalBlocked().toLocaleString()}</div>
                    <div className="stat-label">Total Bloqueado</div>
                  </div>
                </div>
                {onOpenPrivacyReport && (
                  <button 
                    className="privacy-report-button"
                    onClick={onOpenPrivacyReport}
                    title="Ver relatório completo"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Relatório Completo</span>
                  </button>
                )}
              </div>
              
              <div className="privacy-stats-grid">
                <div className="privacy-stat-mini tracker">
                  <div className="mini-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-value">{privacyStats.trackersBlocked.toLocaleString()}</div>
                    <div className="mini-stat-label">Rastreadores</div>
                  </div>
                </div>
                
                <div className="privacy-stat-mini ads">
                  <div className="mini-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 11c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11z"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-value">{privacyStats.adsBlocked.toLocaleString()}</div>
                    <div className="mini-stat-label">Anúncios</div>
                  </div>
                </div>
                
                <div className="privacy-stat-mini cookies">
                  <div className="mini-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 2a10 10 0 0 0-2 19.5M12 2a10 10 0 0 1 2 19.5"/>
                      <path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01"/>
                    </svg>
                  </div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-value">{privacyStats.thirdPartyCookiesBlocked.toLocaleString()}</div>
                    <div className="mini-stat-label">Cookies</div>
                  </div>
                </div>
                
                <div className="privacy-stat-mini scripts">
                  <div className="mini-stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                      <line x1="12" y1="12" x2="12" y2="18"/>
                    </svg>
                  </div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-value">{privacyStats.thirdPartyScriptsBlocked.toLocaleString()}</div>
                    <div className="mini-stat-label">Scripts</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="quick-access">
            {favorites.length > 0 && (
              <div className="access-section">
                <div className="access-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Favoritos</span>
                </div>
                <div className="access-items">
                  {favorites.map(fav => (
                    <button
                      key={fav.id}
                      className="access-item"
                      onClick={() => onNavigate(fav.url)}
                      title={fav.url}
                    >
                      <span className="access-item-title">{fav.title}</span>
                      <span className="access-item-url">{getDomainFromUrl(fav.url)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentHistory.length > 0 && (
              <div className="access-section">
                <div className="access-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Visitado Recentemente</span>
                </div>
                <div className="access-items">
                  {recentHistory.map(item => (
                    <button
                      key={item.id}
                      className="access-item"
                      onClick={() => onNavigate(item.url)}
                      title={item.url}
                    >
                      <span className="access-item-title">{item.title}</span>
                      <span className="access-item-meta">
                        {getDomainFromUrl(item.url)} • {formatTime(item.last_visit_at)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {favorites.length === 0 && recentHistory.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p className="empty-text">Comece navegando ou adicione favoritos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

