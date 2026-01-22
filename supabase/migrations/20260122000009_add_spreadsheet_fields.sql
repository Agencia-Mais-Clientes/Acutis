-- ============================================
-- MIGRATION: Adicionar campos de planilha
-- Armazena IDs da planilha e aba para tracking de leads
-- ============================================

-- Adiciona coluna para ID da planilha (spreadsheet)
ALTER TABLE public.config_empresas 
ADD COLUMN IF NOT EXISTS spreadsheet_id TEXT;

-- Adiciona coluna para ID da aba (sheet/gid)
ALTER TABLE public.config_empresas 
ADD COLUMN IF NOT EXISTS sheet_id TEXT;

-- Comentários
COMMENT ON COLUMN public.config_empresas.spreadsheet_id IS 'ID da planilha Google Sheets para tracking de leads';
COMMENT ON COLUMN public.config_empresas.sheet_id IS 'ID da aba (gid) dentro da planilha Google Sheets';
