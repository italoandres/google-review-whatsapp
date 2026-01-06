import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessApi } from '../services/api';
import { AxiosError } from 'axios';
import { ErrorResponse, FormErrors } from '../types';
import './SetupPage.css';

const ConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await businessApi.getConfig();
      setBusinessName(config.businessName);
      setWhatsappNumber(config.whatsappNumber);
      setGoogleReviewLink(config.googleReviewLink);
      setDefaultMessage(config.defaultMessage);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response?.status === 404) {
        // Configuração não existe - redirecionar para setup
        navigate('/setup');
      } else {
        setErrors({ general: 'Erro ao carregar configuração' });
      }
    } finally {
      setLoading(false);
    }
  };

  const validateFields = (): boolean => {
    const newErrors: FormErrors = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Nome do negócio é obrigatório';
    }

    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'Número do WhatsApp é obrigatório';
    } else if (!/^55\d{10,11}$/.test(whatsappNumber.replace(/\D/g, ''))) {
      newErrors.whatsappNumber = 'Formato: 55 + DDD + número (ex: 5511999999999)';
    }

    if (!googleReviewLink.trim()) {
      newErrors.googleReviewLink = 'Link de avaliação é obrigatório';
    } else if (!googleReviewLink.startsWith('http')) {
      newErrors.googleReviewLink = 'Link deve começar com http:// ou https://';
    }

    if (!defaultMessage.trim()) {
      newErrors.defaultMessage = 'Mensagem padrão é obrigatória';
    } else if (defaultMessage.length < 10) {
      newErrors.defaultMessage = 'Mensagem muito curta (mínimo 10 caracteres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning(null);
    setSuccess(false);

    if (!validateFields()) {
      return;
    }

    setSaving(true);

    try {
      const response = await businessApi.saveConfig({
        businessName: businessName.trim(),
        whatsappNumber: whatsappNumber.replace(/\D/g, ''),
        googleReviewLink: googleReviewLink.trim(),
        defaultMessage: defaultMessage.trim(),
      });

      // Verificar se há warning
      if ((response as any).warning) {
        setWarning((response as any).warning);
      }

      setSuccess(true);

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
        <h1>Configurações do Negócio</h1>
        <p className="subtitle">Edite os dados do seu negócio</p>

        {errors.general && <div className="error-message">{errors.general}</div>}
        {warning && <div className="warning-message">{warning}</div>}
        {success && <div className="success-message">Configuração salva com sucesso!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="businessName">Nome do Negócio *</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Restaurante do João"
              disabled={saving}
            />
            {errors.businessName && (
              <span className="field-error">{errors.businessName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="whatsappNumber">Número do WhatsApp *</label>
            <input
              id="whatsappNumber"
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="5511999999999 (DDI + DDD + número)"
              disabled={saving}
            />
            {errors.whatsappNumber && (
              <span className="field-error">{errors.whatsappNumber}</span>
            )}
            <small>Formato: 55 (Brasil) + DDD + número</small>
          </div>

          <div className="form-group">
            <label htmlFor="googleReviewLink">Link de Avaliação do Google *</label>
            <input
              id="googleReviewLink"
              type="url"
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
              placeholder="https://g.page/..."
              disabled={saving}
            />
            {errors.googleReviewLink && (
              <span className="field-error">{errors.googleReviewLink}</span>
            )}
            <small>Cole o link oficial de avaliação do Google My Business</small>
          </div>

          <div className="form-group">
            <label htmlFor="defaultMessage">Mensagem Padrão *</label>
            <textarea
              id="defaultMessage"
              value={defaultMessage}
              onChange={(e) => setDefaultMessage(e.target.value)}
              placeholder="Mensagem que será enviada aos clientes"
              disabled={saving}
              rows={6}
            />
            {errors.defaultMessage && (
              <span className="field-error">{errors.defaultMessage}</span>
            )}
            <small>Use {'{{'} link_google {'}}'}  para incluir o link de avaliação</small>
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
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigPage;
