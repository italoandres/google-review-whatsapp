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

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setError(null);
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancelar' : '+ Novo Cliente'}
        </button>
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

      {clients.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            Nenhum cliente cadastrado ainda.
            <br />
            Clique em "Novo Cliente" para começar.
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
                <th>Status</th>
                <th>Data Envio</th>
                <th>Data Avaliação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name || '-'}</td>
                  <td>{formatPhone(client.phone)}</td>
                  <td>{formatDate(client.attendanceDate)}</td>
                  <td>{getStatusBadge(client.reviewStatus)}</td>
                  <td>
                    {client.sentAt ? formatDate(client.sentAt) : '-'}
                  </td>
                  <td>
                    {client.reviewedAt ? formatDate(client.reviewedAt) : '-'}
                  </td>
                  <td>
                    {client.reviewStatus === 'NOT_SENT' && !client.complained && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleRequestReview(client)}
                      >
                        📱 Pedir Avaliação
                      </button>
                    )}
                    {client.reviewStatus === 'SENT' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleMarkAsReviewed(client)}
                      >
                        ✅ Marcar como Avaliado
                      </button>
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
