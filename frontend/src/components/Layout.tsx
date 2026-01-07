import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⭐</span>
            <span className="logo-text">Avaliações Google</span>
          </div>
          <nav className="nav">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              📊 Dashboard
            </Link>
            <Link to="/clients" className={`nav-link ${isActive('/clients')}`}>
              👥 Clientes
            </Link>
            <Link to="/config" className={`nav-link ${isActive('/config')}`}>
              ⚙️ Configurações
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <p>Sistema de Solicitação de Avaliações Google via WhatsApp</p>
      </footer>
    </div>
  );
};

export default Layout;
