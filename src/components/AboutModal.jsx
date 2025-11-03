import React from 'react';
import './Modal.css';

function AboutModal({ onClose }) {
  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ℹ️ Sobre o Catnip Secure Browser</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p><strong>Catnip Secure Browser</strong> é um navegador web focado em privacidade e segurança.</p>
          <h3>Recursos de Privacidade:</h3>
          <ul>
            <li>Bloqueio de rastreadores e anúncios</li>
            <li>Proteção contra fingerprinting</li>
            <li>Bloqueio de cookies de terceiros</li>
            <li>HTTPS Only mode</li>
            <li>Limpeza automática de dados</li>
            <li>Bloqueio de notificações e geolocalização</li>
          </ul>
          <p><strong>Versão:</strong> 1.0.0</p>
          <p><strong>Powered by:</strong> Electron + React</p>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;

