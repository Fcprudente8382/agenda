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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../config/supabase';
import { format } from 'date-fns';

interface Despesa {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  user_id: string;
  created_at: string;
  observacoes?: string;
  forma_pagamento?: string;
}

interface Categoria {
  id: number;
  nome: string;
}

const CATEGORIAS_PADRAO = [
  'Impostos',
  'Taxas',
  'Material',
  'Deslocamento',
  'Alimentação',
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Outros',
];

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [open, setOpen] = useState(false);
  const [openCategoria, setOpenCategoria] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date(),
    categoria: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchDespesas();
    fetchCategorias();
  }, []);

  const fetchDespesas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (error) throw error;
      setDespesas(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categorias_despesa')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleOpen = (despesa?: Despesa) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormData({
        descricao: despesa.descricao,
        valor: despesa.valor.toString(),
        data: new Date(despesa.data),
        categoria: despesa.categoria,
      });
    } else {
      setEditingDespesa(null);
      setFormData({
        descricao: '',
        valor: '',
        data: new Date(),
        categoria: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDespesa(null);
    setError(null);
  };

  const handleOpenCategoria = () => {
    setOpenCategoria(true);
  };

  const handleCloseCategoria = () => {
    setOpenCategoria(false);
    setNovaCategoria('');
  };

  const handleSubmitCategoria = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (!novaCategoria.trim()) {
        setError('O nome da categoria é obrigatório');
        return;
      }

      const { error } = await supabase
        .from('categorias_despesa')
        .insert([
          {
            nome: novaCategoria.trim(),
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      await fetchCategorias();
      handleCloseCategoria();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorNumerico = parseFloat(formData.valor);

      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        setError('O valor deve ser um número positivo');
        return;
      }

      if (!formData.categoria) {
        setError('A categoria é obrigatória');
        return;
      }

      const despesaData = {
        descricao: formData.descricao.trim(),
        valor: valorNumerico,
        data: formData.data.toISOString(),
        categoria: formData.categoria,
        user_id: user.id,
      };

      if (editingDespesa) {
        const { error } = await supabase
          .from('despesas')
          .update(despesaData)
          .eq('id', editingDespesa.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('despesas')
          .insert([despesaData]);

        if (error) throw error;
      }

      await fetchDespesas();
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
        .from('despesas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchDespesas();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const despesasFiltradas = despesas.filter((despesa) =>
    despesa.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Despesas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Nova Despesa
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
        placeholder="Buscar por descrição..."
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
        {despesasFiltradas.map((despesa) => (
          <Grid item xs={12} sm={6} md={4} key={despesa.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {despesa.descricao}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {despesa.observacoes || 'Sem observações'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Data: {format(new Date(despesa.data), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body2">
                  Valor: R$ {despesa.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Categoria: {despesa.categoria}
                </Typography>
                <Typography variant="body2">
                  Forma de Pagamento: {despesa.forma_pagamento}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(despesa)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(despesa.id)}
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
          {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Descrição"
              fullWidth
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
            />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data"
                value={formData.data}
                onChange={(newValue) =>
                  setFormData({ ...formData, data: newValue || new Date() })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.categoria}
                label="Categoria"
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value })
                }
              >
                {CATEGORIAS_PADRAO.map((categoria) => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </MenuItem>
                ))}
              </Select>
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={handleOpenCategoria}
                  size="small"
                >
                  <AddCircleIcon />
                </IconButton>
              </InputAdornment>
            </FormControl>
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
            {editingDespesa ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCategoria} onClose={handleCloseCategoria} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Categoria</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome da Categoria"
              fullWidth
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoria}>Cancelar</Button>
          <Button onClick={handleSubmitCategoria} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 