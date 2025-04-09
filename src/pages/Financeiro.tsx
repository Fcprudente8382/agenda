import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

export default function Financeiro() {
  const [valorMes, setValorMes] = useState<number>(0);
  const [quantidadeConsultas, setQuantidadeConsultas] = useState<number>(0);
  const [valorConvenio, setValorConvenio] = useState<number>(0);
  const [valorParticular, setValorParticular] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());

  useEffect(() => {
    fetchDadosMes();
  }, [dataReferencia]);

  const getNomeMes = (data: Date) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[data.getMonth()];
  };

  const handleMesAnterior = () => {
    const novaData = new Date(dataReferencia);
    novaData.setMonth(novaData.getMonth() - 1);
    setDataReferencia(novaData);
  };

  const handleMesPosterior = () => {
    const novaData = new Date(dataReferencia);
    novaData.setMonth(novaData.getMonth() + 1);
    setDataReferencia(novaData);
  };

  const fetchDadosMes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtém o primeiro e último dia do mês selecionado
      const primeiroDiaMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
      const ultimoDiaMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('compromissos')
        .select('valor, paciente')
        .eq('user_id', user.id)
        .gte('data', primeiroDiaMes.toISOString())
        .lte('data', ultimoDiaMes.toISOString());

      if (error) throw error;

      // Calcula os valores totais por tipo de paciente
      let totalConvenio = 0;
      let totalParticular = 0;
      let totalGeral = 0;

      data?.forEach(compromisso => {
        const valor = Number(compromisso.valor) || 0;
        if (compromisso.paciente === 'convenio') {
          totalConvenio += valor;
        } else {
          totalParticular += valor;
        }
        totalGeral += valor;
      });

      setValorMes(totalGeral);
      setValorConvenio(totalConvenio);
      setValorParticular(totalParticular);
      setQuantidadeConsultas(data?.length || 0);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMesAno = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <IconButton onClick={handleMesAnterior} size="small">
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="subtitle1" color="textSecondary">
        {getNomeMes(dataReferencia)} de {dataReferencia.getFullYear()}
      </Typography>
      <IconButton onClick={handleMesPosterior} size="small">
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Financeiro
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valor do Mês
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">
                  Erro ao carregar dados: {error}
                </Typography>
              ) : (
                <>
                  {renderMesAno()}
                  <Typography variant="h5" component="div">
                    R$ {valorMes.toFixed(2)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Consultas no Mês
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">
                  Erro ao carregar dados: {error}
                </Typography>
              ) : (
                <>
                  {renderMesAno()}
                  <Typography variant="h5" component="div">
                    {quantidadeConsultas} consultas
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valores por Tipo de Paciente
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">
                  Erro ao carregar dados: {error}
                </Typography>
              ) : (
                <>
                  {renderMesAno()}
                  <Box sx={{ 
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Convênio
                      </Typography>
                      <Typography variant="subtitle1" component="div">
                        R$ {valorConvenio.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Particular
                      </Typography>
                      <Typography variant="subtitle1" component="div">
                        R$ {valorParticular.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 