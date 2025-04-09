/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { supabase, Compromisso } from '../config/supabase';
import { format } from 'date-fns';

interface TipoAtendimento {
  id: number;
  nome: string;
}

interface Paciente {
  id: number;
  nome: string;
}

interface DataHora {
  data: Date;
  hora: Date;
}

export default function Agenda() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [compromissosFiltrados, setCompromissosFiltrados] = useState<Compromisso[]>([]);
  const [tiposAtendimento, setTiposAtendimento] = useState<TipoAtendimento[]>([]);
  const [open, setOpen] = useState(false);
  const [openTipoAtendimento, setOpenTipoAtendimento] = useState(false);
  const [novoTipoAtendimento, setNovoTipoAtendimento] = useState('');
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: new Date(),
    hora: new Date(),
    duracao: '',
    valor: '',
    tipo_atendimento: '',
    paciente: 'particular' as 'convenio' | 'particular',
  });
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [replicarCompromisso, setReplicarCompromisso] = useState(false);
  const [datasHoras, setDatasHoras] = useState<DataHora[]>([{ data: new Date(), hora: new Date() }]);

  useEffect(() => {
    fetchCompromissos();
    fetchTiposAtendimento();
    fetchPacientes();
  }, []);

  useEffect(() => {
    const filtrados = compromissos.filter(compromisso =>
      compromisso.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (compromisso.paciente === 'convenio' ? 'Convênio' : 'Particular').toLowerCase().includes(busca.toLowerCase())
    );
    setCompromissosFiltrados(filtrados);
  }, [compromissos, busca]);

  const fetchCompromissos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: true });

      if (error) {
        console.error('Erro ao buscar compromissos:', error);
        throw error;
      }
      console.log('Compromissos encontrados:', data);
      setCompromissos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar compromissos:', error);
      setError(error.message || 'Erro ao buscar compromissos');
    }
  };

  const fetchTiposAtendimento = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_atendimento')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setTiposAtendimento(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

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

  const handleOpen = (compromisso?: Compromisso) => {
    if (compromisso) {
      setEditingCompromisso(compromisso);
      setFormData({
        titulo: compromisso.titulo,
        descricao: compromisso.descricao,
        data: new Date(compromisso.data),
        hora: new Date(`2000-01-01T${compromisso.hora}`),
        duracao: compromisso.duracao.toString(),
        valor: compromisso.valor.toString(),
        tipo_atendimento: compromisso.tipo_atendimento || '',
        paciente: compromisso.paciente || 'particular',
      });
      setReplicarCompromisso(false);
      setDatasHoras([{ data: new Date(compromisso.data), hora: new Date(`2000-01-01T${compromisso.hora}`) }]);
    } else {
      setEditingCompromisso(null);
      setFormData({
        titulo: '',
        descricao: '',
        data: new Date(),
        hora: new Date(),
        duracao: '',
        valor: '',
        tipo_atendimento: '',
        paciente: 'particular',
      });
      setReplicarCompromisso(false);
      setDatasHoras([{ data: new Date(), hora: new Date() }]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompromisso(null);
    setError(null);
  };

  const handleAddDataHora = () => {
    setDatasHoras([...datasHoras, { data: new Date(), hora: new Date() }]);
  };

  const handleRemoveDataHora = (index: number) => {
    setDatasHoras(datasHoras.filter((_, i) => i !== index));
  };

  const handleDataHoraChange = (index: number, field: 'data' | 'hora', value: Date) => {
    const newDatasHoras = [...datasHoras];
    newDatasHoras[index] = { ...newDatasHoras[index], [field]: value };
    setDatasHoras(newDatasHoras);
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorNumerico = parseFloat(formData.valor);
      const duracaoNumerica = parseInt(formData.duracao);

      if (isNaN(valorNumerico)) {
        setError('O valor deve ser um número válido');
        return;
      }

      if (isNaN(duracaoNumerica) || duracaoNumerica <= 0) {
        setError('A duração deve ser um número positivo');
        return;
      }

      if (!formData.tipo_atendimento) {
        setError('O tipo de atendimento é obrigatório');
        return;
      }

      const compromissosData = replicarCompromisso
        ? datasHoras.map(({ data, hora }) => ({
            titulo: formData.titulo.trim(),
            descricao: formData.descricao.trim(),
            data: data.toISOString(),
            hora: hora.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duracao: duracaoNumerica,
            valor: valorNumerico,
            tipo_atendimento: formData.tipo_atendimento.trim(),
            paciente: formData.paciente,
            user_id: user.id,
          }))
        : [{
            titulo: formData.titulo.trim(),
            descricao: formData.descricao.trim(),
            data: formData.data.toISOString(),
            hora: formData.hora.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duracao: duracaoNumerica,
            valor: valorNumerico,
            tipo_atendimento: formData.tipo_atendimento.trim(),
            paciente: formData.paciente,
            user_id: user.id,
          }];

      if (editingCompromisso) {
        const { error } = await supabase
          .from('compromissos')
          .update(compromissosData[0])
          .eq('id', editingCompromisso.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('compromissos')
          .insert(compromissosData);

        if (error) throw error;
      }

      await fetchCompromissos();
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
        .from('compromissos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchCompromissos();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleOpenTipoAtendimento = () => {
    setOpenTipoAtendimento(true);
  };

  const handleCloseTipoAtendimento = () => {
    setOpenTipoAtendimento(false);
    setNovoTipoAtendimento('');
  };

  const handleSubmitTipoAtendimento = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (!novoTipoAtendimento.trim()) {
        setError('O nome do tipo de atendimento é obrigatório');
        return;
      }

      const { error } = await supabase
        .from('tipos_atendimento')
        .insert([
          {
            nome: novoTipoAtendimento.trim(),
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      await fetchTiposAtendimento();
      handleCloseTipoAtendimento();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Meus Compromissos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Novo Compromisso
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
        placeholder="Buscar por nome ou tipo de paciente..."
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
        {compromissos.map((compromisso) => (
          <Grid item xs={12} sm={6} md={4} key={compromisso.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {compromisso.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {compromisso.descricao}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Data: {format(new Date(compromisso.data), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body2">
                  Hora: {compromisso.hora}
                </Typography>
                <Typography variant="body2">
                  Duração: {compromisso.duracao} minutos
                </Typography>
                <Typography variant="body2">
                  Valor: R$ {compromisso.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Tipo: {compromisso.tipo_atendimento}
                </Typography>
                <Typography variant="body2">
                  Paciente: {compromisso.paciente}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(compromisso)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(compromisso.id)}
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
          {editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Nome do Paciente</InputLabel>
              <Select
                value={formData.titulo}
                label="Nome do Paciente"
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              >
                {pacientes.map((paciente) => (
                  <MenuItem key={paciente.id} value={paciente.nome}>
                    {paciente.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tipo de Atendimento</InputLabel>
              <Select
                value={formData.tipo_atendimento}
                label="Tipo de Atendimento"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo_atendimento: e.target.value,
                  })
                }
              >
                {tiposAtendimento.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.nome}>
                    {tipo.nome}
                  </MenuItem>
                ))}
              </Select>
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={handleOpenTipoAtendimento}
                  size="small"
                >
                  <AddCircleIcon />
                </IconButton>
              </InputAdornment>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Paciente</InputLabel>
              <Select
                value={formData.paciente}
                label="Paciente"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paciente: e.target.value as 'convenio' | 'particular',
                  })
                }
              >
                <MenuItem value="particular">Particular</MenuItem>
                <MenuItem value="convenio">Convênio</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={replicarCompromisso}
                  onChange={(e) => setReplicarCompromisso(e.target.checked)}
                />
              }
              label="Replicar compromisso"
            />
            {replicarCompromisso ? (
              <Stack spacing={2}>
                {datasHoras.map((dataHora, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                      <DatePicker
                        label="Data"
                        value={dataHora.data}
                        onChange={(newValue) =>
                          handleDataHoraChange(index, 'data', newValue || new Date())
                        }
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                      <TimePicker
                        label="Hora"
                        value={dataHora.hora}
                        onChange={(newValue) =>
                          handleDataHoraChange(index, 'hora', newValue || new Date())
                        }
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                    {index > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveDataHora(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddDataHora}
                  variant="outlined"
                >
                  Adicionar Data/Hora
                </Button>
              </Stack>
            ) : (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data"
                  value={formData.data}
                  onChange={(newValue) =>
                    setFormData({ ...formData, data: newValue || new Date() })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <TimePicker
                  label="Hora"
                  value={formData.hora}
                  onChange={(newValue) =>
                    setFormData({ ...formData, hora: newValue || new Date() })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            )}
            <TextField
              label="Duração (minutos)"
              type="number"
              fullWidth
              value={formData.duracao}
              onChange={(e) =>
                setFormData({ ...formData, duracao: e.target.value })
              }
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
            <TextField
              label="Valor"
              type="number"
              fullWidth
              value={formData.valor}
              onChange={(e) =>
                setFormData({ ...formData, valor: e.target.value })
              }
              InputProps={{
                startAdornment: 'R$',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCompromisso ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTipoAtendimento} onClose={handleCloseTipoAtendimento} maxWidth="xs" fullWidth>
        <DialogTitle>Novo Tipo de Atendimento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome do Tipo de Atendimento"
              fullWidth
              value={novoTipoAtendimento}
              onChange={(e) => setNovoTipoAtendimento(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTipoAtendimento}>Cancelar</Button>
          <Button onClick={handleSubmitTipoAtendimento} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 