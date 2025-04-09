import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { supabase } from '../config/supabase';
import { format } from 'date-fns';

interface Paciente {
  id: number;
  nome: string;
}

interface FichaClinica {
  id: number;
  paciente_id: number;
  queixa_principal: string;
  diagnostico: string;
  medicamentos: string;
  avaliacao_tratamento: string;
  consideracoes: string;
  created_at: string;
  pacientes: {
    id: number;
    nome: string;
  } | null;
}

export default function FichaClinica() {
  const [fichas, setFichas] = useState<FichaClinica[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFicha, setEditingFicha] = useState<FichaClinica | null>(null);
  const [formData, setFormData] = useState({
    paciente_id: '',
    queixa_principal: '',
    diagnostico: '',
    medicamentos: '',
    avaliacao_tratamento: '',
    consideracoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchFichas();
    fetchPacientes();
  }, []);

  const fetchFichas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return;
    }

    try {
      // Primeiro, buscar as fichas clínicas
      const { data: fichasData, error: fichasError } = await supabase
        .from('fichas_clinicas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fichasError) throw fichasError;

      // Para cada ficha, buscar o nome do paciente
      const fichasComPacientes = await Promise.all(
        (fichasData || []).map(async (ficha) => {
          const { data: pacienteData } = await supabase
            .from('pacientes')
            .select('nome')
            .eq('id', ficha.paciente_id)
            .single();

          return {
            ...ficha,
            pacientes: pacienteData || { nome: 'N/A' }
          };
        })
      );

      console.log('Fichas encontradas:', fichasComPacientes);
      setFichas(fichasComPacientes);
      
    } catch (error) {
      console.error('Erro ao buscar fichas:', error);
    }
  };

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar pacientes:', error);
      return;
    }

    setPacientes(data || []);
  };

  const handleOpenDialog = (ficha?: FichaClinica) => {
    if (ficha) {
      setEditingFicha(ficha);
      setFormData({
        paciente_id: ficha.paciente_id.toString(),
        queixa_principal: ficha.queixa_principal,
        diagnostico: ficha.diagnostico,
        medicamentos: ficha.medicamentos,
        avaliacao_tratamento: ficha.avaliacao_tratamento,
        consideracoes: ficha.consideracoes,
      });
    } else {
      setEditingFicha(null);
      setFormData({
        paciente_id: '',
        queixa_principal: '',
        diagnostico: '',
        medicamentos: '',
        avaliacao_tratamento: '',
        consideracoes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFicha(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const fichaData = {
        paciente_id: parseInt(formData.paciente_id),
        queixa_principal: formData.queixa_principal,
        diagnostico: formData.diagnostico,
        medicamentos: formData.medicamentos,
        avaliacao_tratamento: formData.avaliacao_tratamento,
        consideracoes: formData.consideracoes,
        user_id: user.id,
      };

      if (editingFicha) {
        const { error } = await supabase
          .from('fichas_clinicas')
          .update(fichaData)
          .eq('id', editingFicha.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fichas_clinicas')
          .insert([fichaData]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchFichas();
    } catch (error) {
      console.error('Erro ao salvar ficha:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ficha?')) {
      return;
    }

    const { error } = await supabase
      .from('fichas_clinicas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir ficha:', error);
      return;
    }

    fetchFichas();
  };

  const fichasFiltradas = fichas.filter(ficha => ficha.pacientes?.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ficha Clínica</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Ficha
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nome do paciente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
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
        {fichasFiltradas.map((ficha) => (
          <Grid item xs={12} sm={6} md={4} key={ficha.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {ficha.pacientes?.nome || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {ficha.queixa_principal || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Data: {format(new Date(ficha.created_at), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body2">
                  Diagnóstico: {ficha.diagnostico || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Avaliação/Tratamento: {ficha.avaliacao_tratamento || 'N/A'}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(ficha)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(ficha.id)}
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
          {editingFicha ? 'Editar Ficha Clínica' : 'Nova Ficha Clínica'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Paciente</InputLabel>
                <Select
                  value={formData.paciente_id}
                  label="Paciente"
                  onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                >
                  {pacientes.map((paciente) => (
                    <MenuItem key={paciente.id} value={paciente.id}>
                      {paciente.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Queixa Principal"
                multiline
                rows={2}
                value={formData.queixa_principal}
                onChange={(e) => setFormData({ ...formData, queixa_principal: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnóstico"
                multiline
                rows={3}
                value={formData.diagnostico}
                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medicamentos"
                multiline
                rows={3}
                value={formData.medicamentos}
                onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Avaliação/Tratamento"
                multiline
                rows={3}
                value={formData.avaliacao_tratamento}
                onChange={(e) => setFormData({ ...formData, avaliacao_tratamento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Considerações"
                multiline
                rows={3}
                value={formData.consideracoes}
                onChange={(e) => setFormData({ ...formData, consideracoes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {editingFicha ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 