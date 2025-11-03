import React, { useState, useEffect } from 'react';
import './ModalBase.css';
import './PrivacyReportModal.css';

function PrivacyReportModal({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Atualizar estatísticas a cada 2 segundos
    const interval = setInterval(loadStats, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getPrivacyStats();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setLoading(false);
      }
    }
  };

  const resetStats = async () => {
    if (window.confirm('Tem certeza que deseja resetar todas as estatísticas?')) {
      if (window.electronAPI) {
        try {
          await window.electronAPI.resetPrivacyStats();
          await loadStats();
        } catch (error) {
          console.error('Erro ao resetar estatísticas:', error);
        }
      }
    }
  };

  if (loading || !stats) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Relatório de Privacidade</h2>
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="loading">
            <p>Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalBlocked = stats.trackersBlocked + stats.adsBlocked + stats.thirdPartyCookiesBlocked + stats.thirdPartyScriptsBlocked;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Relatório de Privacidade</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="report-content">
          <div className="stats-summary">
            <div className="stat-card total">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{totalBlocked.toLocaleString()}</div>
                <div className="stat-label">Total Bloqueado</div>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card tracker">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.trackersBlocked.toLocaleString()}</div>
                <div className="stat-label">Rastreadores Bloqueados</div>
                <div className="stat-desc">Scripts e requisições de rastreamento</div>
              </div>
            </div>

            <div className="stat-card ads">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 11c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11z"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.adsBlocked.toLocaleString()}</div>
                <div className="stat-label">Anúncios Bloqueados</div>
                <div className="stat-desc">Scripts e recursos publicitários</div>
              </div>
            </div>

            <div className="stat-card cookies">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a10 10 0 0 0-2 19.5M12 2a10 10 0 0 1 2 19.5"/>
                  <path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.thirdPartyCookiesBlocked.toLocaleString()}</div>
                <div className="stat-label">Cookies de Terceiros Bloqueados</div>
                <div className="stat-desc">Cookies bloqueados em requisições</div>
              </div>
            </div>

            <div className="stat-card scripts">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                  <line x1="12" y1="12" x2="12" y2="18"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.thirdPartyScriptsBlocked.toLocaleString()}</div>
                <div className="stat-label">Scripts de Terceiros Bloqueados</div>
                <div className="stat-desc">Scripts externos bloqueados</div>
              </div>
            </div>
          </div>

          {stats.topTrackers && stats.topTrackers.length > 0 && (
            <div className="top-trackers">
              <h3>Top Domínios Bloqueados</h3>
              <div className="trackers-list">
                {stats.topTrackers.slice(0, 10).map((tracker, index) => (
                  <div key={index} className="tracker-item">
                    <div className="tracker-rank">{index + 1}</div>
                    <div className="tracker-domain">{tracker.domain}</div>
                    <div className="tracker-count">{tracker.count.toLocaleString()}x</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="report-footer">
            <button className="btn-secondary" onClick={resetStats}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Resetar Estatísticas
            </button>
            <div className="last-updated">
              Última atualização: {new Date(stats.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyReportModal;

