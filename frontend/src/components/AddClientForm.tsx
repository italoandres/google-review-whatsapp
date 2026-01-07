import React, { useState } from 'react';
import { clientsApi } from '../services/api';
import { AxiosError } from 'axios';
import { ErrorResponse, FormErrors } from '../types';
import './AddClientForm.css';

interface AddClientFormProps {
  onClientAdded: () => void;
}

const AddClientForm: React.FC<AddClientFormProps> = ({ onClientAdded }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [satisfied, setSatisfied] = useState(true);
  const [complained, setComplained] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateFields = (): boolean => {
    const newErrors: FormErrors = {};

    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^55\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Formato: 55 + DDD + número (ex: 5511999999999)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      await clientsApi.create({
        name: name.trim() || undefined,
        phone: phone.replace(/\D/g, ''),
        satisfied,
        complained,
      });

      // Limpar formulário
      setName('');
      setPhone('');
      setSatisfied(true);
      setComplained(false);
      setErrors({});

      // Notificar componente pai
      onClientAdded();
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;

      if (errorData?.error === 'PHONE_ALREADY_EXISTS') {
        setErrors({ phone: 'Este telefone já está cadastrado.' });
      } else if (errorData?.details) {
        setErrors(errorData.details);
      } else if (errorData?.field) {
        setErrors({ [errorData.field]: errorData.message });
      } else {
        setErrors({ general: errorData?.message || 'Erro ao cadastrar cliente' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Atualizar checkboxes de forma mutuamente exclusiva para "reclamou"
  const handleComplainedChange = (checked: boolean) => {
    setComplained(checked);
    if (checked) {
      setSatisfied(false);
    }
  };

  const handleSatisfiedChange = (checked: boolean) => {
    setSatisfied(checked);
    if (checked) {
      setComplained(false);
    }
  };

  return (
    <div className="add-client-form card">
      <h2>Cadastrar Novo Cliente</h2>

      {errors.general && <div className="error-message">{errors.general}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="name">Nome (opcional)</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="phone">Telefone *</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5511999999999"
              disabled={loading}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
        </div>

        <div className="checkboxes-row">
          <div className="checkbox-group">
            <input
              id="satisfied"
              type="checkbox"
              checked={satisfied}
              onChange={(e) => handleSatisfiedChange(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="satisfied">Cliente satisfeito</label>
          </div>

          <div className="checkbox-group">
            <input
              id="complained"
              type="checkbox"
              checked={complained}
              onChange={(e) => handleComplainedChange(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="complained">Cliente reclamou</label>
          </div>
        </div>

        {complained && (
          <div className="warning-message">
            ⚠️ Clientes que reclamaram não poderão receber solicitação de avaliação.
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
        </button>
      </form>
    </div>
  );
};

export default AddClientForm;
