import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import RecuperarSenha from './pages/RecuperarSenha';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Pacientes from './pages/Pacientes';
import Financeiro from './pages/Financeiro';
import Despesas from './pages/Despesas';
import FichaClinica from './pages/FichaClinica';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Evolucao from './pages/Evolucao';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import { User } from '@supabase/supabase-js';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return null; // ou um componente de loading
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? 
                <Navigate to="/agenda" /> : 
                <Login onLogin={() => {}} />
            } 
          />
          <Route 
            path="/cadastro" 
            element={
              user ? 
                <Navigate to="/agenda" /> : 
                <Cadastro />
            } 
          />
          <Route 
            path="/recuperar-senha" 
            element={
              user ? 
                <Navigate to="/agenda" /> : 
                <RecuperarSenha />
            } 
          />
          <Route 
            path="/" 
            element={
              user ? 
                <Navigate to="/agenda" /> : 
                <Navigate to="/login" />
            } 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Pacientes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Agenda />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Financeiro />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/despesas"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Despesas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Relatorios />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Configuracoes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ficha-clinica"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <FichaClinica />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evolucao"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Evolucao />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
