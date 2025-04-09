import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
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
  email?: string;
  telefone: string;
  cpf?: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  user_id: string;
  created_at: string;
  observacoes?: string;
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setPacientes(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleOpen = (paciente?: Paciente) => {
    if (paciente) {
      setEditingPaciente(paciente);
      setFormData({
        nome: paciente.nome,
        email: paciente.email || '',
        telefone: paciente.telefone,
        cpf: paciente.cpf || '',
        data_nascimento: paciente.data_nascimento,
        cep: paciente.cep,
        logradouro: paciente.logradouro,
        numero: paciente.numero,
        complemento: paciente.complemento,
        bairro: paciente.bairro,
        cidade: paciente.cidade,
        estado: paciente.estado,
      });
    } else {
      setEditingPaciente(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        data_nascimento: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPaciente(null);
    setError(null);
  };

  const handleCepChange = async (cep: string) => {
    if (cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      setFormData(prev => ({
        ...prev,
        cep: cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }));
    } catch (error: any) {
      setError('Erro ao buscar CEP: ' + error.message);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const pacienteData = {
        nome: formData.nome.trim(),
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim(),
        cpf: formData.cpf.trim() || null,
        data_nascimento: formData.data_nascimento.trim(),
        cep: formData.cep.trim(),
        logradouro: formData.logradouro.trim(),
        numero: formData.numero.trim(),
        complemento: formData.complemento.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim(),
        user_id: user.id,
      };

      if (editingPaciente) {
        const { error } = await supabase
          .from('pacientes')
          .update(pacienteData)
          .eq('id', editingPaciente.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pacientes')
          .insert([pacienteData]);

        if (error) throw error;
      }

      await fetchPacientes();
      handleClose();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchPacientes();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const pacientesFiltrados = pacientes.filter((paciente) =>
    paciente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Pacientes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Novo Paciente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nome..."
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
        {pacientesFiltrados.map((paciente) => (
          <Grid item xs={12} sm={6} md={4} key={paciente.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {paciente.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {paciente.observacoes || 'Sem observações'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Data de Nascimento: {format(new Date(paciente.data_nascimento), 'dd/MM/yyyy')}
                </Typography>
                {paciente.email && (
                  <Typography variant="body2">
                    Email: {paciente.email}
                  </Typography>
                )}
                {paciente.telefone && (
                  <Typography variant="body2">
                    Telefone: {paciente.telefone}
                  </Typography>
                )}
                {paciente.cpf && (
                  <Typography variant="body2">
                    CPF: {paciente.cpf}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(paciente)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(paciente.id)}
                >
                  Excluir
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPaciente ? 'Editar Paciente' : 'Novo Paciente'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <TextField
              label="Telefone"
              fullWidth
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
            />
            <TextField
              label="CPF"
              fullWidth
              value={formData.cpf}
              onChange={(e) =>
                setFormData({ ...formData, cpf: e.target.value })
              }
            />
            <TextField
              label="Data de Nascimento"
              fullWidth
              type="date"
              value={formData.data_nascimento}
              onChange={(e) =>
                setFormData({ ...formData, data_nascimento: e.target.value })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Endereço</Typography>

            <TextField
              label="CEP"
              fullWidth
              value={formData.cep}
              onChange={(e) => {
                const cep = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, cep });
                if (cep.length === 8) {
                  handleCepChange(cep);
                }
              }}
              disabled={loadingCep}
              helperText={loadingCep ? 'Buscando CEP...' : ''}
            />
            <TextField
              label="Logradouro"
              fullWidth
              value={formData.logradouro}
              onChange={(e) =>
                setFormData({ ...formData, logradouro: e.target.value })
              }
              disabled={loadingCep}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Número"
                fullWidth
                value={formData.numero}
                onChange={(e) =>
                  setFormData({ ...formData, numero: e.target.value })
                }
              />
              <TextField
                label="Complemento"
                fullWidth
                value={formData.complemento}
                onChange={(e) =>
                  setFormData({ ...formData, complemento: e.target.value })
                }
              />
            </Box>
            <TextField
              label="Bairro"
              fullWidth
              value={formData.bairro}
              onChange={(e) =>
                setFormData({ ...formData, bairro: e.target.value })
              }
              disabled={loadingCep}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Cidade"
                fullWidth
                value={formData.cidade}
                onChange={(e) =>
                  setFormData({ ...formData, cidade: e.target.value })
                }
                disabled={loadingCep}
              />
              <TextField
                label="Estado"
                fullWidth
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                disabled={loadingCep}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPaciente ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 