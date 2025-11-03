import React, { useState, useEffect } from 'react';
import './ModalBase.css';
import './HistoryModal.css';

function HistoryModal({ onClose, onNavigate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchHistory(searchQuery);
    } else {
      loadHistory();
    }
  }, [searchQuery]);

  const loadHistory = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.historyGet({ limit: 100 });
        setHistory(data);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const searchHistory = async (query) => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.historySearch(query, 50);
        setHistory(data);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.historyDelete(id);
      if (searchQuery.trim()) {
        searchHistory(searchQuery);
      } else {
        loadHistory();
      }
    }
  };

  const handleClear = async () => {
    if (window.electronAPI && confirm('Tem certeza que deseja limpar todo o histórico?')) {
      await window.electronAPI.historyClear();
      setHistory([]);
    }
  };

  const handleNavigate = (url) => {
    onNavigate(url);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} h atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Histórico</h2>
          <div className="modal-header-actions">
            <button className="btn-clear" onClick={handleClear} title="Limpar histórico">
              Limpar
            </button>
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="modal-search">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <p>Nenhum histórico encontrado</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-icon">
                    {item.favicon ? (
                      <img 
                        src={item.favicon} 
                        alt="" 
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }} 
                      />
                    ) : null}
                    <div className="history-icon-placeholder" style={{ display: item.favicon ? 'none' : 'flex' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="history-info" onClick={() => handleNavigate(item.url)}>
                    <div className="history-title">{item.title}</div>
                    <div className="history-url">{item.url}</div>
                    <div className="history-meta">
                      <span>{formatDate(item.last_visit_at)}</span>
                      {item.visit_count > 1 && <span>• {item.visit_count} visitas</span>}
                    </div>
                  </div>
                  <button 
                    className="history-delete"
                    onClick={() => handleDelete(item.id)}
                    title="Remover do histórico"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;

