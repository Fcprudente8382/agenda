import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  Stack,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

interface Template {
  id: number;
  nome: string;
  conteudo: string;
  campos_disponiveis: string[];
  papel_timbrado_url?: string;
  user_id: string;
  created_at: string;
}

interface Campo {
  nome: string;
  tabela: string;
  descricao: string;
}

export default function Relatorios() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>({});
  
  const [formData, setFormData] = useState({
    nome: '',
    conteudo: '',
    papel_timbrado_url: '',
  });

  // Campos disponíveis no sistema
  const camposDisponiveis: Campo[] = [
    { nome: 'nome_paciente', tabela: 'pacientes', descricao: 'Nome do Paciente' },
    { nome: 'data_nascimento', tabela: 'pacientes', descricao: 'Data de Nascimento' },
    { nome: 'queixa_principal', tabela: 'fichas_clinicas', descricao: 'Queixa Principal' },
    { nome: 'diagnostico', tabela: 'fichas_clinicas', descricao: 'Diagnóstico' },
    { nome: 'avaliacao_tratamento', tabela: 'fichas_clinicas', descricao: 'Avaliação/Tratamento' },
    { nome: 'data_consulta', tabela: 'agenda', descricao: 'Data da Consulta' },
    { nome: 'data_evolucao', tabela: 'evolucoes', descricao: 'Data da Evolução' },
    { nome: 'descricao_evolucao', tabela: 'evolucoes', descricao: 'Descrição da Evolução' },
    { nome: 'profissional', tabela: 'profiles', descricao: 'Nome do Profissional' },
    { nome: 'especializacao', tabela: 'profiles', descricao: 'Especialização' },
    { nome: 'conselho_classe', tabela: 'profiles', descricao: 'Conselho de Classe' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('templates_relatorios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        nome: template.nome,
        conteudo: template.conteudo,
        papel_timbrado_url: template.papel_timbrado_url || '',
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        nome: '',
        conteudo: '',
        papel_timbrado_url: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
  };

  const handleInsertField = (campo: Campo) => {
    const tag = `{{${campo.nome}}}`;
    setFormData(prev => ({
      ...prev,
      conteudo: prev.conteudo + tag
    }));
    setAnchorEl(null);
  };

  const handleUploadTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        papel_timbrado_url: publicUrl
      }));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const templateData = {
        nome: formData.nome,
        conteudo: formData.conteudo,
        papel_timbrado_url: formData.papel_timbrado_url,
        user_id: user.id,
        campos_disponiveis: camposDisponiveis.map(c => c.nome),
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from('templates_relatorios')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('templates_relatorios')
          .insert([templateData]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('templates_relatorios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
    }
  };

  const handlePreview = async (template: Template) => {
    setSelectedTemplate(template);
    await fetchPacientes();
    setOpenPreview(true);
  };

  const handlePacienteChange = async (event: SelectChangeEvent<number>) => {
    const pacienteId = event.target.value as number;
    setSelectedPacienteId(pacienteId);
    if (selectedTemplate) {
      await fetchPreviewData(selectedTemplate, pacienteId);
    }
  };

  const fetchPreviewData = async (_template: Template, pacienteId: number) => {
    try {
      setLoadingPreview(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados do profissional
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Buscar dados do paciente selecionado
      const { data: pacienteData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single();

      // Buscar última ficha clínica do paciente selecionado
      const { data: fichaData } = await supabase
        .from('fichas_clinicas')
        .select('*')
        .eq('user_id', user.id)
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Buscar todas as consultas do paciente na tabela compromissos
      const { data: compromissosData } = await supabase
        .from('compromissos')
        .select('*')
        .eq('user_id', user.id)
        .eq('titulo', pacienteData?.nome)
        .order('data', { ascending: false });

      // Buscar todas as evoluções do paciente
      const { data: evolucoesData } = await supabase
        .from('evolucoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('paciente_id', pacienteId)
        .order('data_evolucao', { ascending: false });

      // Formatar as datas das consultas
      const datasConsultas = compromissosData
        ?.map(compromisso => {
          const data = new Date(compromisso.data);
          return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        })
        .join(', ') || 'Nenhuma consulta registrada';

      // Formatar as datas das evoluções
      const datasEvolucoes = evolucoesData
        ?.map(evolucao => {
          const data = new Date(evolucao.data_evolucao);
          return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        })
        .join(', ') || 'Nenhuma evolução registrada';

      // Formatar as descrições das evoluções
      const descricoesEvolucoes = evolucoesData
        ?.map(evolucao => evolucao.descricao)
        .join('\n\n') || 'Nenhuma evolução registrada';

      // Montar objeto com todos os dados
      const dados = {
        nome_paciente: pacienteData?.nome || 'NOME DO PACIENTE',
        data_nascimento: pacienteData?.data_nascimento || 'DATA DE NASCIMENTO',
        queixa_principal: fichaData?.queixa_principal || 'QUEIXA PRINCIPAL',
        diagnostico: fichaData?.diagnostico || 'DIAGNÓSTICO',
        avaliacao_tratamento: fichaData?.avaliacao_tratamento || 'AVALIAÇÃO/TRATAMENTO',
        data_consulta: datasConsultas,
        data_evolucao: datasEvolucoes,
        descricao_evolucao: descricoesEvolucoes,
        profissional: profileData?.nome || 'NOME DO PROFISSIONAL',
        especializacao: profileData?.especializacao || 'ESPECIALIZAÇÃO',
        conselho_classe: profileData?.conselho_classe || 'CONSELHO DE CLASSE',
      };

      setPreviewData(dados);
    } catch (error) {
      console.error('Erro ao buscar dados para preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        setPacientes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const handleDownload = () => {
    // Implemente a lógica para baixar o relatório
    console.log('Download do relatório');
  };

  const replaceFields = (content: string, data: { [key: string]: string }) => {
    let replacedContent = content;
    Object.entries(data).forEach(([key, value]) => {
      replacedContent = replacedContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return replacedContent;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Relatórios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Relatório
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {template.conteudo}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <IconButton onClick={() => handleOpenDialog(template)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handlePreview(template)}>
                    <PreviewIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(template.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para criar/editar template */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTemplate ? 'Editar Relatório' : 'Novo Relatório'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Relatório"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  Inserir Campo
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<UploadIcon />}
                  sx={{ ml: 1 }}
                >
                  Upload Template
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept=".doc,.docx,.pdf"
                  onChange={handleUploadTemplate}
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Conteúdo"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Digite o texto do relatório. Use {{campo}} para inserir campos dinâmicos."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu de campos disponíveis */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {camposDisponiveis.map((campo) => (
          <MenuItem
            key={campo.nome}
            onClick={() => handleInsertField(campo)}
          >
            <Tooltip title={`Tabela: ${campo.tabela}`}>
              <ListItemText 
                primary={campo.descricao}
                secondary={`{{${campo.nome}}}`}
              />
            </Tooltip>
          </MenuItem>
        ))}
      </Menu>

      {/* Dialog de preview */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pré-visualização</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="select-paciente-preview-label">Selecione o Paciente</InputLabel>
              <Select
                labelId="select-paciente-preview-label"
                id="select-paciente-preview"
                value={selectedPacienteId || ''}
                label="Selecione o Paciente"
                onChange={handlePacienteChange}
              >
                <MenuItem value="">
                  <em>Selecione um paciente</em>
                </MenuItem>
                {pacientes.map((paciente) => (
                  <MenuItem key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {loadingPreview ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <Typography>Carregando dados...</Typography>
            </Box>
          ) : selectedPacienteId ? (
            <>
              {selectedTemplate?.papel_timbrado_url && (
                <Box sx={{ mb: 2 }}>
                  <img 
                    className="report-letterhead-image"
                    src={selectedTemplate.papel_timbrado_url} 
                    alt="Papel Timbrado"
                  />
                </Box>
              )}
              <Typography whiteSpace="pre-wrap">
                {selectedTemplate && replaceFields(selectedTemplate.conteudo, previewData)}
              </Typography>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <Typography>Selecione um paciente para visualizar o relatório</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Fechar</Button>
          <Button 
            onClick={handleDownload}
            variant="contained"
            disabled={loadingPreview || !selectedPacienteId}
            startIcon={<SaveIcon />}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 