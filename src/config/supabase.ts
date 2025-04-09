import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Compromisso {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  duracao: number;
  valor: number;
  tipo_atendimento: string;
  paciente: 'convenio' | 'particular';
  user_id: string;
  created_at: string;
} 