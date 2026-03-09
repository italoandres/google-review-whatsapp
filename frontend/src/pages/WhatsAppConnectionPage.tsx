import React, { useState, useEffect, useCallback } from 'react';
import { whatsappApi } from '../services/api';
import QRCodeDisplay from '../components/QRCodeDisplay';
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';
import { AxiosError } from 'axios';
import './WhatsAppConnectionPage.css';

type PageStatus = 'idle' | 'creating' | 'waiting_scan' | 'connected' | 'error';
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
  const [pageStatus, setPageStatus] = useState<PageStatus>('idle');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [qrCodeRetryAttempt, setQrCodeRetryAttempt] = useState(0);

  const MAX_POLLING_ATTEMPTS = 120; // 6 minutes (120 * 3 seconds)
  const POLLING_INTERVAL_MS = 3000; // 3 seconds
  const MAX_QR_CODE_RETRIES = 10;
  const QR_CODE_RETRY_DELAY_MS = 2000; // 2 seconds

  // Check connection status on mount only
  useEffect(() => {
    checkConnectionStatus();

    // Cleanup: stop polling when component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []); // Run only once on mount

  const checkConnectionStatus = async () => {
    try {
      const response = await whatsappApi.getConnectionStatus();
      setConnectionStatus(response.status);

      if (response.status === 'connected') {
        setPageStatus('connected');
        setConnectionInfo({
          instanceName: response.instanceName || 'Instância WhatsApp',
          connectedAt: response.connectedAt || new Date().toISOString(),
        });
      } else if (response.status === 'connecting') {
        // Don't call fetchQRCode here - it causes conflicts
        // Just set the status, the user needs to manually connect
        setPageStatus('idle');
      } else {
        setPageStatus('idle');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setPageStatus('idle');
    }
  };

  const startPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    setPollingAttempts(0);

    const interval = setInterval(async () => {
      setPollingAttempts((prev) => {
        const newAttempts = prev + 1;

        if (newAttempts >= MAX_POLLING_ATTEMPTS) {
          clearInterval(interval);

          // CRITICAL FIX: Final verification before showing error
          (async () => {
            try {
              const finalCheck = await whatsappApi.getConnectionStatus();
              if (finalCheck.status === 'connected') {
                // Success! Connection happened during polling
                setPageStatus('connected');
                setConnectionInfo({
                  instanceName: finalCheck.instanceName || 'Instância WhatsApp',
                  connectedAt: finalCheck.connectedAt || new Date().toISOString(),
                });
                return;
              }
            } catch (error) {
              console.error('Final check failed:', error);
            }

            // Only show error if truly not connected
            setErrorMessage(
              'Tempo limite excedido. Por favor, tente novamente.'
            );
            setPageStatus('error');
          })();

          return newAttempts;
        }

        return newAttempts;
      });

      try {
        const response = await whatsappApi.getConnectionStatus();
        setConnectionStatus(response.status);

        if (response.status === 'connected') {
          clearInterval(interval);
          setPageStatus('connected');
          setConnectionInfo({
            instanceName: response.instanceName || 'Instância WhatsApp',
            connectedAt: response.connectedAt || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error polling connection status:', error);
      }
    }, POLLING_INTERVAL_MS);

    setPollingInterval(interval);
  }, [pollingInterval]);

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setPollingAttempts(0);
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
        setQrCodeRetryAttempt(0); // Reset counter on success
        startPolling();
        return; // Success!
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;

        // If 404 and not last attempt, wait and retry
        if (axiosError.response?.status === 404 && attempt < retries - 1) {
          console.log(`QR code not ready yet, retrying in ${QR_CODE_RETRY_DELAY_MS/1000}s... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, QR_CODE_RETRY_DELAY_MS));
          continue;
        }

        // Last attempt or other error
        setQrCodeRetryAttempt(0); // Reset counter

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
    stopPolling();
    await fetchQRCode();
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
      return;
    }

    try {
      await whatsappApi.disconnect();
      stopPolling();
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

  const handleReconnect = async () => {
    setErrorMessage(null);
    setPageStatus('creating');

    try {
      const response = await whatsappApi.reconnect();
      setQrCode(response.qrCode);
      setConnectionInfo({
        instanceName: response.instanceName,
      });
      setPageStatus('waiting_scan');
      setConnectionStatus('connecting');
      startPolling();
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;
      setErrorMessage(errorData?.message || 'Erro ao reconectar WhatsApp');
      setPageStatus('error');
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
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(pollingAttempts / MAX_POLLING_ATTEMPTS) * 100}%` }}
              />
            </div>
            <p className="attempts-text">
              Aguardando conexão... (Tentativa {pollingAttempts} de {MAX_POLLING_ATTEMPTS})
            </p>
            <p className="time-remaining">
              Tempo restante: {Math.floor((MAX_POLLING_ATTEMPTS - pollingAttempts) * POLLING_INTERVAL_MS / 60000)} minutos
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
