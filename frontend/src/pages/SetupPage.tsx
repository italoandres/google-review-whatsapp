import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessApi } from '../services/api';
import { AxiosError } from 'axios';
import { ErrorResponse, FormErrors } from '../types';
import './SetupPage.css';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [defaultMessage, setDefaultMessage] = useState(
    'Olá! Foi um prazer te atender 😊\n\nSe puder, sua avaliação ajuda muito nosso trabalho:\n👉 {{link_google}}'
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    if (!validateFields()) {
      return;
    }

    setLoading(true);

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

      // Redirecionar para página de clientes
      setTimeout(() => {
        navigate('/clients');
      }, 1500);
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
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1>Configuração Inicial</h1>
        <p className="subtitle">Configure os dados do seu negócio</p>

        {errors.general && <div className="error-message">{errors.general}</div>}
        {warning && <div className="warning-message">{warning}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="businessName">Nome do Negócio *</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Restaurante do João"
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              rows={6}
            />
            {errors.defaultMessage && (
              <span className="field-error">{errors.defaultMessage}</span>
            )}
            <small>Use {'{{'} link_google {'}}'}  para incluir o link de avaliação</small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPage;
