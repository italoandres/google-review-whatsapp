import React from 'react';
import './ConnectionStatusIndicator.css';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  lastConnected?: string;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  lastConnected,
  onReconnect,
  onDisconnect,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'connecting':
        return '🔄';
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'WhatsApp Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'WhatsApp Desconectado';
      default:
        return 'Status Desconhecido';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'connected':
        return 'status-connected';
      case 'connecting':
        return 'status-connecting';
      case 'disconnected':
        return 'status-disconnected';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`connection-status-indicator ${getStatusClass()}`}>
      <div className="status-header">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {lastConnected && status === 'connected' && (
        <div className="status-info">
          <p className="last-connected">
            Conectado em: {formatDate(lastConnected)}
          </p>
        </div>
      )}

      <div className="status-actions">
        {status === 'connected' && onDisconnect && (
          <button 
            onClick={onDisconnect}
            className="btn btn-danger"
          >
            Desconectar WhatsApp
          </button>
        )}

        {status === 'disconnected' && onReconnect && (
          <button 
            onClick={onReconnect}
            className="btn btn-primary"
          >
            Reconectar WhatsApp
          </button>
        )}

        {status === 'connecting' && (
          <div className="connecting-spinner">
            <div className="spinner"></div>
            <p>Aguardando conexão...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatusIndicator;
