/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { supabase } from '../config/supabase';
import { format } from 'date-fns';

interface Paciente {
  id: number;
  nome: string;
}

interface Evolucao {
  id: number;
  paciente_id: number;
  data_evolucao: string;
  descricao: string;
  paciente?: Paciente;
  proxima_consulta?: string;
}

export default function Evolucao() {
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvolucao, setSelectedEvolucao] = useState<Evolucao | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    data_evolucao: '',
    descricao: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvolucoes();
    fetchPacientes();
  }, []);

  const fetchEvolucoes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('evolucoes')
        .select(`
          *,
          paciente:pacientes(id, nome)
        `)
        .eq('user_id', user.id)
        .order('data_evolucao', { ascending: false });

      if (error) throw error;
      setEvolucoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar evoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setPacientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const handleOpenDialog = (evolucao?: Evolucao) => {
    if (evolucao) {
      setSelectedEvolucao(evolucao);
      setFormData({
        paciente_id: evolucao.paciente_id.toString(),
        data_evolucao: evolucao.data_evolucao,
        descricao: evolucao.descricao,
      });
    } else {
      setSelectedEvolucao(null);
      setFormData({
        paciente_id: '',
        data_evolucao: '',
        descricao: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvolucao(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const evolucaoData = {
        paciente_id: parseInt(formData.paciente_id),
        data_evolucao: formData.data_evolucao,
        descricao: formData.descricao,
        user_id: user.id,
      };

      if (selectedEvolucao) {
        const { error } = await supabase
          .from('evolucoes')
          .update(evolucaoData)
          .eq('id', selectedEvolucao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('evolucoes')
          .insert([evolucaoData]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchEvolucoes();
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta evolução?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('evolucoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchEvolucoes();
    } catch (error) {
      console.error('Erro ao excluir evolução:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    const dataObj = new Date(data);
    const dia = dataObj.getUTCDate().toString().padStart(2, '0');
    const mes = (dataObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const ano = dataObj.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const filteredEvolucoes = evolucoes.filter(evolucao => 
    evolucao.paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Evolução</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Evolução
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nome do paciente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={2}>
        {filteredEvolucoes.map((evolucao) => (
          <Grid item xs={12} sm={6} md={4} key={evolucao.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {evolucao.paciente?.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {evolucao.descricao}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Data: {format(new Date(evolucao.data_evolucao), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body2">
                  Próxima Consulta: {evolucao.proxima_consulta ? format(new Date(evolucao.proxima_consulta), 'dd/MM/yyyy') : 'Não agendada'}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(evolucao)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(evolucao.id)}
                >
                  Excluir
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEvolucao ? 'Editar Evolução' : 'Nova Evolução'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Paciente"
              value={formData.paciente_id}
              onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
              required
              sx={{ mb: 2 }}
            >
              {pacientes.map((paciente) => (
                <MenuItem key={paciente.id} value={paciente.id}>
                  {paciente.nome}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="date"
              label="Data"
              value={formData.data_evolucao}
              onChange={(e) => setFormData({ ...formData, data_evolucao: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 