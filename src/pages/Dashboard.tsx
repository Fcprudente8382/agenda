import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import { People as PeopleIcon, Event as EventIcon } from '@mui/icons-material';
import { supabase } from '../config/supabase';

interface Atendimento {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  duracao: number;
  tipo_atendimento: string;
}

export default function Dashboard() {
  const [quantidadePacientes, setQuantidadePacientes] = useState<number>(0);
  const [quantidadeAtendimentos, setQuantidadeAtendimentos] = useState<number>(0);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuantidadePacientes();
    fetchAtendimentosHoje();
  }, []);

  const fetchQuantidadePacientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { count, error } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setQuantidadePacientes(count || 0);
    } catch (error) {
      console.error('Erro ao buscar quantidade de pacientes:', error);
    }
  };

  const fetchAtendimentosHoje = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obtém a data atual no formato YYYY-MM-DD
      const hoje = new Date();
      const dataInicio = new Date(hoje.setHours(0, 0, 0, 0)).toISOString();
      const dataFim = new Date(hoje.setHours(23, 59, 59, 999)).toISOString();

      // Primeiro, vamos fazer uma contagem separada
      const { count, error: countError } = await supabase
        .from('compromissos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('data', dataInicio)
        .lte('data', dataFim);

      if (countError) throw countError;

      // Depois, buscamos os dados completos
      const { data, error: dataError } = await supabase
        .from('compromissos')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: true });

      if (dataError) throw dataError;

      console.log('Data Início:', dataInicio);
      console.log('Data Fim:', dataFim);
      console.log('Quantidade de Atendimentos:', count);
      console.log('Dados dos Atendimentos:', data);

      setQuantidadeAtendimentos(count || 0);
      setAtendimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar atendimentos do dia:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={{ borderRadius: '25%', width: '50%', aspectRatio: '1' }}>
              <CardContent sx={{ textAlign: 'center', py: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Pacientes
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Typography variant="h4" component="div">
                    {quantidadePacientes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={{ borderRadius: '25%', width: '50%', aspectRatio: '1' }}>
              <CardContent sx={{ textAlign: 'center', py: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <EventIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Atendimentos
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" component="div">
                      {quantidadeAtendimentos}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 1 }}>
                      {new Date().toLocaleDateString('pt-BR')}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" sx={{ mb: 2 }}>Atendimentos do Dia</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>Duração</TableCell>
              <TableCell>Tipo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : atendimentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhum atendimento para hoje
                </TableCell>
              </TableRow>
            ) : (
              atendimentos.map((atendimento) => (
                <TableRow key={atendimento.id}>
                  <TableCell>{atendimento.titulo}</TableCell>
                  <TableCell>{atendimento.hora}</TableCell>
                  <TableCell>{atendimento.duracao} minutos</TableCell>
                  <TableCell>{atendimento.tipo_atendimento}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 