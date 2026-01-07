import React, { useState, useEffect } from 'react';
import { clientsApi, Metrics } from '../services/api';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setError(null);
      const data = await clientsApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Erro ao carregar métricas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Carregando métricas...</div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="container">
        <div className="error-message">{error || 'Erro ao carregar métricas'}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>📊 Dashboard</h1>

      <div className="metrics-grid">
        {/* Métricas de Envio */}
        <div className="metrics-card">
          <div className="metrics-card-header">
            <h2>📱 Envios de Links (Automático)</h2>
            <p className="metrics-subtitle">
              Controle do sistema - Links enviados via WhatsApp
            </p>
          </div>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Hoje</span>
              <span className="metric-value">{metrics.sentToday}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Esta semana</span>
              <span className="metric-value">{metrics.sentWeek}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Este mês</span>
              <span className="metric-value">{metrics.sentMonth}</span>
            </div>
          </div>
        </div>

        {/* Métricas de Avaliação */}
        <div className="metrics-card">
          <div className="metrics-card-header">
            <h2>✅ Avaliações Confirmadas (Manual)</h2>
            <p className="metrics-subtitle">
              Controle humano - Clientes marcados como avaliados
            </p>
          </div>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Esta semana</span>
              <span className="metric-value metric-value-success">
                {metrics.reviewedWeek}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Este mês</span>
              <span className="metric-value metric-value-success">
                {metrics.reviewedMonth}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso importante */}
      <div className="info-box">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h3>Sobre as Métricas</h3>
          <ul>
            <li>
              <strong>Envios:</strong> Contabilizados automaticamente quando você
              clica em "Pedir Avaliação"
            </li>
            <li>
              <strong>Avaliações:</strong> Marcadas manualmente quando você confirma
              que o cliente avaliou no Google
            </li>
            <li>
              ⚠️ O sistema não identifica automaticamente avaliações feitas no Google
            </li>
          </ul>
        </div>
      </div>

      {/* Taxa de conversão */}
      {metrics.sentWeek > 0 && (
        <div className="conversion-card">
          <h3>📈 Taxa de Conversão (Esta Semana)</h3>
          <div className="conversion-stats">
            <div className="conversion-item">
              <span className="conversion-label">Links enviados</span>
              <span className="conversion-value">{metrics.sentWeek}</span>
            </div>
            <div className="conversion-arrow">→</div>
            <div className="conversion-item">
              <span className="conversion-label">Avaliações confirmadas</span>
              <span className="conversion-value">{metrics.reviewedWeek}</span>
            </div>
            <div className="conversion-arrow">=</div>
            <div className="conversion-item">
              <span className="conversion-label">Taxa</span>
              <span className="conversion-value conversion-percentage">
                {((metrics.reviewedWeek / metrics.sentWeek) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
