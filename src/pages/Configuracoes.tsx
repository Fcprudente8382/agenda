import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { supabase } from '../config/supabase';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  profissional: string;
  especializacao: string;
  conselho_classe: string;
}

export default function Configuracoes() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    nome: '',
    email: '',
    profissional: '',
    especializacao: '',
    conselho_classe: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário no Authentication
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Primeiro, preencher o email do Authentication
      setProfile(prev => ({
        ...prev,
        id: user.id,
        email: user.email || ''
      }));

      // Depois, tentar buscar outros dados do profile se existirem
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Se encontrou dados no profile, atualiza os campos
      if (data) {
        setProfile(prev => ({
          ...prev,
          nome: data.nome || '',
          profissional: data.profissional || '',
          especializacao: data.especializacao || '',
          conselho_classe: data.conselho_classe || ''
        }));
      }
      // Se não encontrou dados (error), deixa os campos vazios para o usuário preencher
      
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      showNotification('Erro ao carregar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Inserir/Atualizar dados no profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          nome: profile.nome,
          profissional: profile.profissional,
          especializacao: profile.especializacao,
          conselho_classe: profile.conselho_classe,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      showNotification('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showNotification('Erro ao atualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setShowMessage(true);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Configurações
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Informações Pessoais
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                value={profile.nome}
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail"
                value={profile.email}
                disabled
                helperText="O e-mail não pode ser alterado"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Profissional"
                value={profile.profissional}
                onChange={(e) => setProfile({ ...profile, profissional: e.target.value })}
                disabled={loading}
                placeholder="Ex: Fisioterapeuta"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Especialização"
                value={profile.especializacao}
                onChange={(e) => setProfile({ ...profile, especializacao: e.target.value })}
                disabled={loading}
                placeholder="Ex: Fisioterapia Esportiva"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Conselho de Classe"
                value={profile.conselho_classe}
                onChange={(e) => setProfile({ ...profile, conselho_classe: e.target.value })}
                disabled={loading}
                placeholder="Ex: CREFITO-3 12345-F"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={() => setShowMessage(false)}
      >
        <Alert
          onClose={() => setShowMessage(false)}
          severity={message.type as 'success' | 'error'}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
} 