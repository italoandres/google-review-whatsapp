import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../types';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação básica
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = isRegister
        ? await authApi.register(email, password)
        : await authApi.login(email, password);

      // Salvar token e usuário no localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Redirecionar para página principal
      navigate('/clients');
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(
        axiosError.response?.data?.message || 
        'Erro ao fazer login. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Sistema de Avaliações Google</h1>
        <p className="subtitle">
          {isRegister ? 'Criar nova conta' : 'Entre com sua conta'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Aguarde...' : (isRegister ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="toggle-mode">
          {isRegister ? (
            <p>
              Já tem uma conta?{' '}
              <button 
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="link-button"
              >
                Fazer login
              </button>
            </p>
          ) : (
            <p>
              Não tem uma conta?{' '}
              <button 
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="link-button"
              >
                Criar conta
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
