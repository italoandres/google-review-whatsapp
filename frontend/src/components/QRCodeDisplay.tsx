import React from 'react';
import './QRCodeDisplay.css';

interface QRCodeDisplayProps {
  qrCode: string; // base64 image
  onRefresh: () => void;
  expiresIn?: number; // seconds
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrCode, onRefresh, expiresIn }) => {
  return (
    <div className="qrcode-display">
      <div className="qrcode-container">
        <img 
          src={qrCode} 
          alt="QR Code WhatsApp" 
          className="qrcode-image"
        />
      </div>
      
      <div className="qrcode-instructions">
        <h3>Escaneie o QR Code</h3>
        <ol>
          <li>Abra o WhatsApp no seu celular</li>
          <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
          <li>Toque em <strong>Aparelhos conectados</strong></li>
          <li>Toque em <strong>Conectar um aparelho</strong></li>
          <li>Aponte seu celular para esta tela para escanear o código</li>
        </ol>
      </div>

      {expiresIn !== undefined && (
        <div className="qrcode-expiry">
          <p>Código expira em: {expiresIn}s</p>
        </div>
      )}

      <button 
        onClick={onRefresh}
        className="btn btn-secondary"
      >
        🔄 Gerar Novo QR Code
      </button>
    </div>
  );
};

export default QRCodeDisplay;
