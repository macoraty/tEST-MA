import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CatalogItem, MaterialList, SupplyRequisition, AppSettings, SupabaseConfig } from './types';

const SUPABASE_STORAGE_KEY = 'industrial_supabase_config_v1';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: '',
  anonKey: '',
  isConnected: false,
};

let supabaseClientInstance: SupabaseClient | null = null;
let currentClientKey = '';

export function getSavedSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') return DEFAULT_SUPABASE_CONFIG;
  try {
    const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.url === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config:', e);
  }
  return DEFAULT_SUPABASE_CONFIG;
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
    // Reset instance if config changed
    supabaseClientInstance = null;
    currentClientKey = '';
  } catch (e) {
    console.error('Error saving Supabase config:', e);
  }
}

export function getSupabaseClient(overrideConfig?: SupabaseConfig): SupabaseClient | null {
  const config = overrideConfig || getSavedSupabaseConfig();
  const trimmedUrl = config.url.trim();
  const trimmedKey = config.anonKey.trim();

  if (!trimmedUrl || !trimmedKey) {
    return null;
  }

  const key = `${trimmedUrl}_${trimmedKey}`;
  if (supabaseClientInstance && currentClientKey === key) {
    return supabaseClientInstance;
  }

  try {
    supabaseClientInstance = createClient(trimmedUrl, trimmedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentClientKey = key;
    return supabaseClientInstance;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
}

/**
 * Tests connection to a Supabase project by pinging the auth or REST endpoint
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  const trimmedUrl = url.trim().replace(/\/$/, '');
  const trimmedKey = anonKey.trim();

  if (!trimmedUrl || !trimmedKey) {
    return { success: false, message: 'URL e Chave Anon do Supabase são obrigatórias.' };
  }

  try {
    const client = createClient(trimmedUrl, trimmedKey);
    // Simple query to verify connection
    const { error } = await client.from('app_data').select('id').limit(1);

    // If table doesn't exist yet, it's still a valid connection to Supabase!
    // Error code 42P01 in Postgres means "relation does not exist"
    if (error && error.code === '42P01') {
      return {
        success: true,
        message: 'Conectado ao Supabase! (Tabela app_data pronta para ser criada via script SQL).',
      };
    }

    if (error && (error.message.includes('Invalid API key') || error.code === 'PGRST301' || error.message.includes('JWT'))) {
      return { success: false, message: 'Chave Anon inválida ou expirada. Verifique as credenciais.' };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao conectar ao Supabase: ${msg}` };
  }
}

/**
 * SQL setup script that user can run in Supabase SQL Editor
 */
export const SUPABASE_SETUP_SQL = `-- SCRIPT DE CRIAÇÃO DAS TABELAS NO SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)

-- Tabela unificada de alta performance e resiliência (JSONB)
CREATE TABLE IF NOT EXISTS public.app_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (RLS) com política de acesso total para a Chave Anon
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso publico app_data" ON public.app_data;
CREATE POLICY "Acesso publico app_data" ON public.app_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Notificação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_data;
`;

/**
 * Sync operations for Supabase
 */
export async function syncDataToSupabase(
  key: 'catalog' | 'lists' | 'requisitions' | 'settings',
  data: unknown
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('app_data').upsert(
      {
        id: key,
        data: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn(`Supabase upsert [${key}] notice:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error syncing ${key} to Supabase:`, err);
    return false;
  }
}

export async function loadDataFromSupabase(
  key: 'catalog' | 'lists' | 'requisitions' | 'settings'
): Promise<unknown | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('app_data')
      .select('data')
      .eq('id', key)
      .single();

    if (error || !data) return null;
    return data.data;
  } catch (err) {
    console.error(`Error loading ${key} from Supabase:`, err);
    return null;
  }
}
