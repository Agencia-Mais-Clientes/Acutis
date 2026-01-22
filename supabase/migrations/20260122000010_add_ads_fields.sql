-- ============================================
-- MIGRATION: Adicionar campos de Ads e Grupo WhatsApp
-- Armazena IDs das contas de anúncios e grupo
-- ============================================

-- Adiciona coluna para ID da conta Meta Ads
ALTER TABLE public.config_empresas 
ADD COLUMN IF NOT EXISTS meta_ads_id TEXT;

-- Adiciona coluna para ID da conta Google Ads
ALTER TABLE public.config_empresas 
ADD COLUMN IF NOT EXISTS google_ads_id TEXT;

-- Adiciona coluna para ID do grupo do WhatsApp
ALTER TABLE public.config_empresas 
ADD COLUMN IF NOT EXISTS whatsapp_group_id TEXT;

-- Comentários
COMMENT ON COLUMN public.config_empresas.meta_ads_id IS 'ID da conta de anúncios Meta Ads';
COMMENT ON COLUMN public.config_empresas.google_ads_id IS 'ID da conta de anúncios Google Ads';
COMMENT ON COLUMN public.config_empresas.whatsapp_group_id IS 'ID do grupo do WhatsApp para notificações';
