import React, { useState, useEffect } from 'react';
import './ModalBase.css';
import './SettingsModal.css';
import { useTheme } from '../hooks/useTheme';
import PrivacyReportModal from './PrivacyReportModal';

function SettingsModal({ privacySettings, onClose, onSave, onClearData }) {
  const [settings, setSettings] = useState(privacySettings);
  const [activeSection, setActiveSection] = useState('privacy');
  const [showReport, setShowReport] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [isLoadingEncryption, setIsLoadingEncryption] = useState(false);
  const { currentTheme, themes, changeTheme } = useTheme();
  
  useEffect(() => {
    setSettings(privacySettings);
    loadEncryptionStatus();
  }, [privacySettings]);
  
  const loadEncryptionStatus = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.encryptionGetStatus();
        if (result.success) {
          setEncryptionEnabled(result.enabled);
        }
      } catch (error) {
        console.error('Erro ao carregar status de criptografia:', error);
      }
    }
  };
  
  const handleEncryptionToggle = async () => {
    setIsLoadingEncryption(true);
    try {
      const newStatus = !encryptionEnabled;
      const result = await window.electronAPI.encryptionSetEnabled(newStatus);
      
      if (result.success) {
        setEncryptionEnabled(newStatus);
        if (newStatus) {
          window.alert('🔐 Criptografia habilitada! Os novos dados serão criptografados automaticamente.\n\nNota: Dados existentes continuarão descriptografados até serem atualizados. Você pode re-criptografar todos os dados existentes usando o botão abaixo.');
        } else {
          window.alert('⚠️ Criptografia desabilitada. Novos dados não serão mais criptografados.');
        }
      } else {
        window.alert('Erro ao alterar status de criptografia: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao alterar criptografia:', error);
      window.alert('Erro ao alterar criptografia: ' + error.message);
    } finally {
      setIsLoadingEncryption(false);
    }
  };
  
  const handleReEncryptAll = async () => {
    if (!encryptionEnabled) {
      window.alert('Por favor, habilite a criptografia primeiro.');
      return;
    }
    
    if (!window.confirm('⚠️ Esta ação irá re-criptografar todos os dados existentes (favoritos e histórico).\n\nIsso pode levar alguns segundos dependendo da quantidade de dados. Continuar?')) {
      return;
    }
    
    setIsLoadingEncryption(true);
    try {
      const result = await window.electronAPI.encryptionReEncryptAll();
      if (result.success) {
        window.alert('✅ ' + (result.message || 'Todos os dados foram re-criptografados com sucesso!'));
      } else {
        window.alert('Erro ao re-criptografar: ' + (result.error || result.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao re-criptografar:', error);
      window.alert('Erro ao re-criptografar: ' + error.message);
    } finally {
      setIsLoadingEncryption(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleClearData = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados de navegação (cookies, cache, histórico, etc.)? Esta ação não pode ser desfeita.')) {
      onClearData();
      window.alert('Todos os dados foram limpos!');
    }
  };

  // Função para retornar ícone SVG baseado no ID da seção
  const getSectionIcon = (sectionId) => {
    const iconSize = 18;
    switch(sectionId) {
      case 'privacy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        );
      case 'security':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      case 'fingerprinting':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        );
      case 'theme':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"></path>
          </svg>
        );
      case 'report':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case 'advanced':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const sections = [
    { id: 'privacy', label: 'Privacidade' },
    { id: 'security', label: 'Segurança' },
    { id: 'fingerprinting', label: 'Fingerprinting' },
    { id: 'theme', label: 'Aparência' },
    { id: 'report', label: 'Relatório' },
    { id: 'advanced', label: 'Avançado' }
  ];

  const privacySettings_list = [
    {
      id: 'blockTrackers',
      label: 'Bloquear Rastreadores',
      desc: 'Bloqueia scripts e requisições de rastreamento de terceiros (Google Analytics, Facebook, etc.)',
      section: 'privacy'
    },
    {
      id: 'blockAds',
      label: 'Bloquear Anúncios',
      desc: 'Bloqueia anúncios e scripts publicitários',
      section: 'privacy'
    },
    {
      id: 'blockThirdPartyCookies',
      label: 'Bloquear Cookies de Terceiros',
      desc: 'Impede que sites de terceiros armazenem cookies',
      section: 'privacy'
    },
    {
      id: 'blockThirdPartyScripts',
      label: 'Bloquear Scripts de Terceiros',
      desc: 'Bloqueia todos os scripts de domínios externos (pode quebrar alguns sites)',
      section: 'privacy'
    },
    {
      id: 'doNotTrack',
      label: 'Enviar Do Not Track',
      desc: 'Envia cabeçalho DNT para todos os sites',
      section: 'privacy'
    },
    {
      id: 'clearDataOnExit',
      label: 'Limpar Dados ao Fechar',
      desc: 'Remove cookies, cache e dados de navegação ao fechar o navegador',
      section: 'privacy'
    }
  ];

  const securitySettings_list = [
    {
      id: 'httpsOnly',
      label: 'HTTPS Apenas',
      desc: 'Redireciona automaticamente conexões HTTP para HTTPS quando possível',
      section: 'security'
    },
    {
      id: 'blockFingerprinting',
      label: 'Proteção Contra Fingerprinting',
      desc: 'Ativa proteções básicas contra identificação única do navegador',
      section: 'security'
    }
  ];

  const fingerprintingSettings_list = [
    {
      id: 'disableWebGL',
      label: 'Proteger WebGL',
      desc: 'Modifica informações do WebGL para prevenir fingerprinting',
      section: 'fingerprinting'
    },
    {
      id: 'disableCanvas',
      label: 'Proteger Canvas',
      desc: 'Bloqueia técnicas de fingerprinting via Canvas (pode quebrar alguns sites)',
      section: 'fingerprinting'
    },
    {
      id: 'disableWebAudio',
      label: 'Proteger Web Audio',
      desc: 'Protege contra fingerprinting via Web Audio API',
      section: 'fingerprinting'
    }
  ];

  const advancedSettings_list = [
    {
      id: 'disableNotifications',
      label: 'Bloquear Notificações',
      desc: 'Bloqueia todas as solicitações de notificações de sites',
      section: 'advanced'
    },
    {
      id: 'disableGeolocation',
      label: 'Bloquear Geolocalização',
      desc: 'Bloqueia todas as solicitações de geolocalização de sites',
      section: 'advanced'
    }
  ];

  const getSettingsForSection = (sectionId) => {
    switch(sectionId) {
      case 'privacy':
        return privacySettings_list;
      case 'security':
        return securitySettings_list;
      case 'fingerprinting':
        return fingerprintingSettings_list;
      case 'advanced':
        return advancedSettings_list;
      default:
        return [];
    }
  };

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
  };

  const SettingItem = ({ setting }) => (
    <div className="setting-item">
      <div className="setting-header">
        <label className="setting-switch">
          <input
            type="checkbox"
            checked={settings[setting.id] || false}
            onChange={() => handleToggle(setting.id)}
          />
          <span className="switch-slider"></span>
        </label>
        <div className="setting-info">
          <span className="setting-label">{setting.label}</span>
          <span className="setting-desc">{setting.desc}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configurações</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-container">
          <div className="settings-sidebar">
            {sections.map(section => (
              <button
                key={section.id}
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="nav-icon">{getSectionIcon(section.id)}</span>
                <span className="nav-label">{section.label}</span>
              </button>
            ))}
          </div>

          <div className="settings-content">
            <div className="settings-section">
              <h3 className="section-title">
                {sections.find(s => s.id === activeSection)?.label}
              </h3>
              
              {activeSection === 'report' ? (
                <div className="report-section">
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Visualize estatísticas detalhadas de rastreadores, anúncios e cookies bloqueados.
                  </p>
                  <button className="btn-primary" onClick={() => setShowReport(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Abrir Relatório Completo
                  </button>
                </div>
              ) : activeSection === 'theme' ? (
                <div className="theme-selector">
                  <div className="themes-grid">
                    {themes.map(theme => (
                      <button
                        key={theme.name}
                        className={`theme-option ${currentTheme.name === theme.name ? 'active' : ''}`}
                        onClick={() => handleThemeChange(theme.name)}
                      >
                        <div className="theme-preview" style={{
                          background: `linear-gradient(135deg, ${theme.colors.bgPrimary} 0%, ${theme.colors.bgSecondary} 100%)`
                        }}>
                          <div className="theme-preview-header" style={{ backgroundColor: theme.colors.bgTertiary }}>
                            <div className="theme-preview-dot" style={{ backgroundColor: theme.colors.danger }}></div>
                            <div className="theme-preview-dot" style={{ backgroundColor: theme.colors.warning }}></div>
                            <div className="theme-preview-dot" style={{ backgroundColor: theme.colors.success }}></div>
                          </div>
                          <div className="theme-preview-content">
                            <div className="theme-preview-bar" style={{ backgroundColor: theme.colors.accent }}></div>
                            <div className="theme-preview-bar" style={{ backgroundColor: theme.colors.bgTertiary, width: '60%' }}></div>
                          </div>
                        </div>
                        <div className="theme-label">{theme.label}</div>
                        {currentTheme.name === theme.name && (
                          <div className="theme-check">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="settings-list">
                    {getSettingsForSection(activeSection).map(setting => (
                      <SettingItem key={setting.id} setting={setting} />
                    ))}
                  </div>

                  {activeSection === 'privacy' && (
                    <div className="settings-actions">
                      <button className="btn-danger" onClick={handleClearData}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Limpar Todos os Dados
                      </button>
                    </div>
                  )}
                  
                  {activeSection === 'security' && (
                    <div className="encryption-section">
                      <div className="setting-item encryption-item">
                        <div className="setting-header">
                          <label className="setting-switch">
                            <input
                              type="checkbox"
                              checked={encryptionEnabled}
                              onChange={handleEncryptionToggle}
                              disabled={isLoadingEncryption}
                            />
                            <span className="switch-slider"></span>
                          </label>
                          <div className="setting-info">
                            <span className="setting-label">Criptografia de Dados Locais</span>
                            <span className="setting-desc">
                              {encryptionEnabled 
                                ? '🔐 Seus favoritos e histórico estão sendo criptografados usando AES-256-GCM. Apenas você pode ler esses dados.'
                                : 'Criptografe seus favoritos e histórico para proteger contra acesso não autorizado. Usa criptografia AES-256-GCM.'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {encryptionEnabled && (
                        <div className="encryption-actions">
                          <button 
                            className="btn-secondary" 
                            onClick={handleReEncryptAll}
                            disabled={isLoadingEncryption}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                            </svg>
                            {isLoadingEncryption ? 'Processando...' : 'Re-criptografar Todos os Dados'}
                          </button>
                          <p className="encryption-note">
                            💡 Re-criptografa dados existentes que foram salvos antes da criptografia ser habilitada.
                          </p>
                        </div>
                      )}
                      
                      <div className="encryption-info">
                        <h4>ℹ️ Como funciona:</h4>
                        <ul>
                          <li>• Usa algoritmo AES-256-GCM (Advanced Encryption Standard)</li>
                          <li>• Chave gerada automaticamente e armazenada de forma segura</li>
                          <li>• Apenas dados locais (favoritos, histórico) são criptografados</li>
                          <li>• Descriptografia automática ao ler dados</li>
                          <li>• Não afeta a navegação ou performance do navegador</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Salvar Configurações
          </button>
        </div>
      </div>

      {showReport && (
        <PrivacyReportModal onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}

export default SettingsModal;

