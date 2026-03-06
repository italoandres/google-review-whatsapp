import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evolutionApi } from '../services/evolutionApi';
import { AxiosError } from 'axios';
import { ErrorResponse, FormErrors } from '../types';
import './SetupPage.css';

const EvolutionConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await evolutionApi.getConfig();
      if (config.configured) {
        setApiUrl(config.apiUrl || '');
        setApiKey(config.apiKey || '');
        setInstanceName(config.instanceName || '');
        setIsEnabled(config.isEnabled || false);
        // Webhook secret is not returned for security
      }
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
      // Não exibir erro se não houver configuração
    } finally {
      setLoading(false);
    }
  };

  const validateFields = (): boolean => {
    const newErrors: FormErrors = {};

    if (!apiUrl.trim()) {
      newErrors.apiUrl = 'URL da API é obrigatória';
    } else if (!apiUrl.startsWith('https://')) {
      newErrors.apiUrl = 'URL deve começar com https://';
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key é obrigatória';
    }

    if (!instanceName.trim()) {
      newErrors.instanceName = 'Nome da instância é obrigatório';
    }

    if (!webhookSecret.trim()) {
      newErrors.webhookSecret = 'Webhook Secret é obrigatório';
    } else if (webhookSecret.length < 32) {
      newErrors.webhookSecret = 'Webhook Secret deve ter pelo menos 32 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    setTestMessage('');

    // Validar campos necessários para teste
    if (!apiUrl.trim() || !apiKey.trim() || !instanceName.trim()) {
      setTestResult('error');
      setTestMessage('Preencha URL, API Key e Nome da Instância para testar');
      return;
    }

    setTesting(true);

    try {
      const result = await evolutionApi.testConnection({
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        instanceName: instanceName.trim(),
      });

      if (result.connected) {
        setTestResult('success');
        setTestMessage('Conexão estabelecida com sucesso!');
      } else {
        setTestResult('error');
        setTestMessage('Falha na conexão. Verifique as credenciais.');
      }
    } catch (err) {
      setTestResult('error');
      setTestMessage('Erro ao testar conexão. Verifique os dados.');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setTestResult(null);

    if (!validateFields()) {
      return;
    }

    setSaving(true);

    try {
      await evolutionApi.saveConfig({
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        instanceName: instanceName.trim(),
        webhookSecret: webhookSecret.trim(),
      });

      setSuccess(true);
      setWebhookSecret(''); // Limpar webhook secret após salvar

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;

      if (errorData?.details) {
        setErrors(errorData.details);
      } else if (errorData?.field) {
        setErrors({ [errorData.field]: errorData.message });
      } else {
        setErrors({ general: errorData?.message || 'Erro ao salvar configuração' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const newEnabled = !isEnabled;
      await evolutionApi.toggleAutoImport(newEnabled);
      setIsEnabled(newEnabled);
    } catch (err) {
      setErrors({ general: 'Erro ao alterar status de auto-importação' });
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Carregando configuração...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Configuração Evolution API</h1>
        <p className="subtitle">Configure a integração com WhatsApp via Evolution API</p>

        {errors.general && <div className="error-message">{errors.general}</div>}
        {success && <div className="success-message">Configuração salva com sucesso!</div>}
        {testResult === 'success' && <div className="success-message">{testMessage}</div>}
        {testResult === 'error' && <div className="error-message">{testMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="apiUrl">URL da API *</label>
            <input
              id="apiUrl"
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://evolution-api.example.com"
              disabled={saving}
            />
            {errors.apiUrl && (
              <span className="field-error">{errors.apiUrl}</span>
            )}
            <small>URL da sua instância Evolution API (deve usar HTTPS)</small>
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">API Key *</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Sua API Key"
              disabled={saving}
            />
            {errors.apiKey && (
              <span className="field-error">{errors.apiKey}</span>
            )}
            <small>Chave de autenticação da Evolution API</small>
          </div>

          <div className="form-group">
            <label htmlFor="instanceName">Nome da Instância *</label>
            <input
              id="instanceName"
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="minha-instancia"
              disabled={saving}
            />
            {errors.instanceName && (
              <span className="field-error">{errors.instanceName}</span>
            )}
            <small>Nome da instância configurada na Evolution API</small>
          </div>

          <div className="form-group">
            <label htmlFor="webhookSecret">Webhook Secret *</label>
            <input
              id="webhookSecret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="Mínimo 32 caracteres"
              disabled={saving}
            />
            {errors.webhookSecret && (
              <span className="field-error">{errors.webhookSecret}</span>
            )}
            <small>Segredo para validação de webhooks (mínimo 32 caracteres)</small>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={testing || saving}
              style={{ width: '100%' }}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={handleToggleEnabled}
                disabled={saving}
              />
              <span>Habilitar Auto-Importação de Clientes</span>
            </label>
            <small>Quando habilitado, novos contatos do WhatsApp serão automaticamente registrados</small>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/clients')}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvolutionConfigPage;
