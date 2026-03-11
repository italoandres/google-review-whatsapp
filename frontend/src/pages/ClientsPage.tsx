import React, { useState, useEffect } from 'react';
import { clientsApi } from '../services/api';
import { Client } from '../types';
import AddClientForm from '../components/AddClientForm';
import './ClientsPage.css';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importSourceFilter, setImportSourceFilter] = useState<'all' | 'manual' | 'auto-imported'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL'>('all');

  useEffect(() => {
    loadClients();
  }, [importSourceFilter]);

  const loadClients = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await clientsApi.getAll(importSourceFilter === 'all' ? undefined : importSourceFilter);
      setClients(data);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadClients();
  };

  const handleRequestReview = async (client: Client) => {
    try {
      const response = await clientsApi.requestReview(client.id);
      
      // Abrir WhatsApp em nova aba
      window.open(response.waLink, '_blank');
      
      // Atualizar lista de clientes
      await loadClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao solicitar avaliação');
    }
  };

  const handleMarkAsReviewed = async (client: Client) => {
    const confirmed = window.confirm(
      `Confirmar Avaliação\n\nVocê confirma que ${client.name || 'este cliente'} avaliou seu negócio no Google?\n\n⚠️ Esta ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await clientsApi.markAsReviewed(client.id);
      
      // Atualizar lista de clientes
      await loadClients();
      
      alert('✅ Cliente marcado como avaliado!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao marcar cliente como avaliado');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13) {
      return `+${clean.substring(0, 2)} ${clean.substring(2, 4)} ${clean.substring(4, 9)}-${clean.substring(9)}`;
    } else if (clean.length === 12) {
      return `+${clean.substring(0, 2)} ${clean.substring(2, 4)} ${clean.substring(4, 8)}-${clean.substring(8)}`;
    }
    return phone;
  };

  const getStatusBadge = (reviewStatus: string) => {
    const badges = {
      NOT_SENT: { text: '⬜ Não Enviado', className: 'status-not-sent' },
      SENT: { text: '🟡 Enviado', className: 'status-sent' },
      REVIEWED_MANUAL: { text: '🟢 Avaliado', className: 'status-reviewed' },
    };
    const badge = badges[reviewStatus as keyof typeof badges] || { text: reviewStatus, className: '' };
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>;
  };

  const getImportSourceBadge = (importSource: string) => {
    if (importSource === 'auto-imported') {
      return <span className="import-badge import-auto" title="Auto-importado do WhatsApp">📱 Auto</span>;
    }
    return <span className="import-badge import-manual" title="Cadastrado manualmente">✍️ Manual</span>;
  };

  // Função para filtrar clientes
  const filteredClients = clients.filter((client) => {
    // Filtro de busca (nome ou telefone)
    const matchesSearch = searchTerm === '' || 
      (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.phone.includes(searchTerm.replace(/\D/g, ''));

    // Filtro de data (range)
    let matchesDate = true;
    if (dateFilterStart && dateFilterEnd) {
      // Validar que a data final não é mais de 90 dias após a inicial
      const start = new Date(dateFilterStart);
      const end = new Date(dateFilterEnd);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 90) {
        // Se passar de 90 dias, ajustar automaticamente
        matchesDate = client.attendanceDate >= dateFilterStart && 
                     client.attendanceDate <= dateFilterStart;
      } else {
        matchesDate = client.attendanceDate >= dateFilterStart && 
                     client.attendanceDate <= dateFilterEnd;
      }
    } else if (dateFilterStart) {
      matchesDate = client.attendanceDate >= dateFilterStart;
    } else if (dateFilterEnd) {
      matchesDate = client.attendanceDate <= dateFilterEnd;
    }

    // Filtro de status
    const matchesStatus = statusFilter === 'all' || 
      client.reviewStatus === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="clients-header">
        <h1>Clientes</h1>
        <div className="header-actions">
          <button
            className="btn btn-refresh"
            onClick={handleRefresh}
            disabled={loading}
            title="Atualizar lista de clientes"
          >
            {loading ? '⏳ Atualizando...' : '🔄 Atualizar'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancelar' : '+ Novo Cliente'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <AddClientForm
          onClientAdded={() => {
            setShowAddForm(false);
            loadClients();
          }}
        />
      )}

      {/* Barra de Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <label>🔍 Buscar</label>
          <input
            type="text"
            placeholder="Nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>📅 Data Início</label>
          <input
            type="date"
            value={dateFilterStart}
            onChange={(e) => setDateFilterStart(e.target.value)}
            className="filter-input"
            max={dateFilterEnd || undefined}
          />
          {dateFilterStart && (
            <button
              className="btn-clear-filter"
              onClick={() => setDateFilterStart('')}
              title="Limpar data início"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <label>📅 Data Fim</label>
          <input
            type="date"
            value={dateFilterEnd}
            onChange={(e) => setDateFilterEnd(e.target.value)}
            className="filter-input"
            min={dateFilterStart || undefined}
          />
          {dateFilterEnd && (
            <button
              className="btn-clear-filter"
              onClick={() => setDateFilterEnd('')}
              title="Limpar data fim"
            >
              ✕
            </button>
          )}
          {dateFilterStart && dateFilterEnd && (() => {
            const start = new Date(dateFilterStart);
            const end = new Date(dateFilterEnd);
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 90) {
              return (
                <span className="date-range-warning">
                  ⚠️ Máx: 90 dias
                </span>
              );
            }
          })()}
        </div>

        <div className="filter-group">
          <label>📊 Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="NOT_SENT">Não Enviado</option>
            <option value="SENT">Enviado</option>
            <option value="REVIEWED_MANUAL">Avaliado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>📱 Origem</label>
          <select
            value={importSourceFilter}
            onChange={(e) => setImportSourceFilter(e.target.value as 'all' | 'manual' | 'auto-imported')}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="manual">Manual</option>
            <option value="auto-imported">Auto-Importado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>&nbsp;</label>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setDateFilterStart('');
              setDateFilterEnd('');
              setStatusFilter('all');
              setImportSourceFilter('all');
            }}
          >
            🔄 Limpar Filtros
          </button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            {clients.length === 0 
              ? 'Nenhum cliente cadastrado ainda. Clique em "Novo Cliente" para começar.'
              : 'Nenhum cliente encontrado com os filtros aplicados.'}
          </p>
        </div>
      ) : (
        <div className="clients-table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Data Atendimento</th>
                <th>Origem</th>
                <th>Status</th>
                <th>Data Envio</th>
                <th>Data Avaliação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name || '-'}</td>
                  <td>{formatPhone(client.phone)}</td>
                  <td>{formatDate(client.attendanceDate)}</td>
                  <td>{getImportSourceBadge(client.importSource || 'manual')}</td>
                  <td>{getStatusBadge(client.reviewStatus)}</td>
                  <td>
                    {client.sentAt ? formatDate(client.sentAt) : '-'}
                  </td>
                  <td>
                    {client.reviewedAt ? formatDate(client.reviewedAt) : '-'}
                  </td>
                  <td>
                    {client.reviewStatus !== 'REVIEWED_MANUAL' && !client.complained && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleRequestReview(client)}
                        title={client.reviewStatus === 'SENT' ? 'Reenviar pedido de avaliação' : 'Enviar pedido de avaliação'}
                      >
                        {client.reviewStatus === 'SENT' ? '🔄 Reenviar' : '📱 Pedir Avaliação'}
                      </button>
                    )}
                    {client.reviewStatus === 'SENT' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleMarkAsReviewed(client)}
                        style={{ marginLeft: '8px' }}
                      >
                        ✅ Marcar como Avaliado
                      </button>
                    )}
                    {client.reviewStatus === 'REVIEWED_MANUAL' && (
                      <span style={{ color: '#28a745', fontSize: '0.9em', fontWeight: 'bold' }}>
                        ✅ Avaliado
                      </span>
                    )}
                    {client.complained && client.reviewStatus === 'NOT_SENT' && (
                      <span style={{ color: '#999', fontSize: '0.9em' }}>
                        Bloqueado (reclamou)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
