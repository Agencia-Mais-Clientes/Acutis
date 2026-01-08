-- ============================================
-- MIGRATION 001: Tabela config_empresas
-- Armazena configurações das empresas (tenants)
-- ============================================

CREATE TABLE IF NOT EXISTS public.config_empresas (
  owner TEXT PRIMARY KEY,              -- Número do WhatsApp da empresa (ex: 5511999999999)
  nome_empresa TEXT NOT NULL,          -- Nome da empresa
  nicho TEXT,                          -- Nicho de atuação (ex: Academia, Clínica)
  objetivo_conversao TEXT,             -- Objetivo de conversão (ex: Aula experimental)
  instrucoes_ia TEXT,                  -- Instruções personalizadas para a IA
  ativo BOOLEAN DEFAULT true,          -- Se a empresa está ativa
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.config_empresas IS 'Configurações das empresas (multi-tenant)';
COMMENT ON COLUMN public.config_empresas.owner IS 'Número do WhatsApp da empresa - identificador único';
