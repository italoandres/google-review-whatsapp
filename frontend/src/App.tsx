import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import ClientsPage from './pages/ClientsPage';
import ConfigPage from './pages/ConfigPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas */}
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <SetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/config"
          element={
            <ProtectedRoute>
              <Layout>
                <ConfigPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Rota padrão - redirecionar para clientes */}
        <Route path="/" element={<Navigate to="/clients" replace />} />

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/clients" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
