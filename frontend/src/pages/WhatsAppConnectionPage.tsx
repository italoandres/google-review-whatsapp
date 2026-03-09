import React, { useState, useEffect } from 'react';
import { whatsappApi } from '../services/api';
import QRCodeDisplay from '../components/QRCodeDisplay';
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';
import { AxiosError } from 'axios';
import './WhatsAppConnectionPage.css';

type PageStatus = 'loading' | 'idle' | 'creating' | 'waiting_scan' | 'connected' | 'error';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ConnectionInfo {
  instanceName: string;
  connectedAt?: string;
  phoneNumber?: string;
}

interface ErrorResponse {
  message: string;
  code?: string;
}

const WhatsAppConnectionPage: React.FC = () => {
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [qrCodeRetryAttempt, setQrCodeRetryAttempt] = useState(0);

  const MAX_QR_CODE_RETRIES = 10;
  const QR_CODE_RETRY_DELAY_MS = 2000;
  const STATUS_CHECK_INTERVAL_MS = 3000; // Check every 3 seconds during polling
  const IDLE_STATUS_CHECK_INTERVAL_MS = 10000; // Check every 10 seconds when idle/error

  // Auto-check status on mount and periodically
  useEffect(() => {
    // Initial check
    checkConnectionStatus();

    // Set up interval to check status periodically
    // More frequent when waiting_scan, less frequent when idle/error
    const interval = setInterval(() => {
      if (pageStatus === 'idle' || pageStatus === 'error') {
        // Check every 10 seconds when idle or error
        checkConnectionStatus();
      } else if (pageStatus === 'waiting_scan') {
        // Check every 3 seconds when waiting for scan
        checkConnectionStatus();
      }
    }, STATUS_CHECK_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, [pageStatus]);

  const checkConnectionStatus = async () => {
    try {
      const response = await whatsappApi.getConnectionStatus();
      setConnectionStatus(response.status);
      
      if (response.status === 'connected') {
        // Connected! Show success
        setPageStatus('connected');
        setConnectionInfo({
          instanceName: response.instanceName || 'Instância WhatsApp',
          connectedAt: response.connectedAt || new Date().toISOString(),
        });
        setErrorMessage(null); // Clear any error message
      } else if (pageStatus === 'loading') {
        // First load and not connected
        setPageStatus('idle');
      }
      // If waiting_scan or creating, don't change status
    } catch (error) {
      console.error('Error checking connection status:', error);
      if (pageStatus === 'loading') {
        setPageStatus('idle');
      }
    }
  };

  const handleConnect = async () => {
    setPageStatus('creating');
    setErrorMessage(null);

    try {
      const response = await whatsappApi.createInstance();
      setConnectionInfo({
        instanceName: response.instanceName,
      });

      // Try to get QR code
      await fetchQRCode();
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;
      
      let message = 'Erro ao criar instância WhatsApp';
      
      if (axiosError.response?.status === 429) {
        message = 'Limite de tentativas excedido. Aguarde alguns minutos e tente novamente.';
      } else if (errorData?.message) {
        message = errorData.message;
      }

      setErrorMessage(message);
      setPageStatus('error');
    }
  };

  const fetchQRCode = async (retries = MAX_QR_CODE_RETRIES) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      setQrCodeRetryAttempt(attempt + 1);
      
      try {
        const response = await whatsappApi.getQRCode();
        setQrCode(response.qrCode);
        setPageStatus('waiting_scan');
        setConnectionStatus('connecting');
        setQrCodeRetryAttempt(0);
        // Don't start polling - the useEffect interval will handle it
        return;
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        
        if (axiosError.response?.status === 404 && attempt < retries - 1) {
          console.log(`QR code not ready yet, retrying in ${QR_CODE_RETRY_DELAY_MS/1000}s... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, QR_CODE_RETRY_DELAY_MS));
          continue;
        }
        
        setQrCodeRetryAttempt(0);
        
        if (axiosError.response?.status === 404) {
          setErrorMessage('QR Code não disponível após várias tentativas. Tente novamente.');
        } else if (axiosError.response?.status === 429) {
          setErrorMessage('Limite de tentativas excedido. Aguarde alguns minutos.');
        } else {
          setErrorMessage('Erro ao obter QR Code');
        }
        
        setPageStatus('error');
        return;
      }
    }
  };

  const handleRefreshQRCode = async () => {
    setErrorMessage(null);
    setQrCodeRetryAttempt(0);
    await fetchQRCode();
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
      return;
    }

    try {
      await whatsappApi.disconnect();
      setPageStatus('idle');
      setConnectionStatus('disconnected');
      setConnectionInfo(null);
      setQrCode(null);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;
      setErrorMessage(errorData?.message || 'Erro ao desconectar WhatsApp');
    }
  };

  return (
    <div className="whatsapp-connection-page">
      <div className="page-header">
        <h1>Conexão WhatsApp</h1>
        <p className="subtitle">
          Conecte seu WhatsApp para enviar mensagens automaticamente
        </p>
      </div>

      {errorMessage && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {errorMessage}
        </div>
      )}

      {pageStatus === 'loading' && (
        <div className="connection-card">
          <div className="loading-state">
            <div className="spinner-large"></div>
            <h2>Verificando status...</h2>
            <p>Aguarde um momento</p>
          </div>
        </div>
      )}

      {pageStatus === 'idle' && (
        <div className="connection-card">
          <div className="idle-state">
            <div className="whatsapp-icon">📱</div>
            <h2>WhatsApp não conectado</h2>
            <p>
              Conecte seu WhatsApp para começar a enviar mensagens de solicitação
              de avaliação automaticamente.
            </p>
            <button 
              onClick={handleConnect}
              className="btn btn-primary btn-large"
            >
              Conectar WhatsApp
            </button>
          </div>
        </div>
      )}

      {pageStatus === 'creating' && (
        <div className="connection-card">
          <div className="loading-state">
            <div className="spinner-large"></div>
            <h2>Criando instância...</h2>
            <p>Aguarde enquanto preparamos sua conexão WhatsApp</p>
            {qrCodeRetryAttempt > 0 && (
              <div className="retry-info">
                <p className="retry-text">
                  Gerando QR code... (tentativa {qrCodeRetryAttempt} de {MAX_QR_CODE_RETRIES})
                </p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(qrCodeRetryAttempt / MAX_QR_CODE_RETRIES) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {pageStatus === 'waiting_scan' && qrCode && (
        <div className="connection-card">
          <QRCodeDisplay 
            qrCode={qrCode}
            onRefresh={handleRefreshQRCode}
          />
          <div className="polling-info">
            <p className="attempts-text">
              Aguardando leitura do QR code...
            </p>
            <p className="time-remaining">
              O sistema detectará automaticamente quando você conectar
            </p>
          </div>
        </div>
      )}

      {pageStatus === 'connected' && connectionInfo && (
        <div className="connection-card">
          <div className="success-message">
            <span className="success-icon">✅</span>
            <h2>WhatsApp conectado com sucesso!</h2>
            <p>Sua instância está ativa e pronta para enviar mensagens.</p>
          </div>

          <ConnectionStatusIndicator
            status={connectionStatus}
            lastConnected={connectionInfo.connectedAt}
            onDisconnect={handleDisconnect}
          />

          {connectionInfo.instanceName && (
            <div className="instance-info">
              <p>
                <strong>Instância:</strong> {connectionInfo.instanceName}
              </p>
            </div>
          )}
        </div>
      )}

      {pageStatus === 'error' && (
        <div className="connection-card">
          <div className="error-state">
            <div className="error-icon-large">❌</div>
            <h2>Erro na conexão</h2>
            <p>{errorMessage}</p>
            <div className="error-actions">
              <button 
                onClick={checkConnectionStatus}
                className="btn btn-secondary"
              >
                Verificar Status
              </button>
              <button 
                onClick={handleConnect}
                className="btn btn-primary"
              >
                Tentar Novamente
              </button>
              <button 
                onClick={() => {
                  setPageStatus('idle');
                  setErrorMessage(null);
                }}
                className="btn btn-secondary"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnectionPage;
