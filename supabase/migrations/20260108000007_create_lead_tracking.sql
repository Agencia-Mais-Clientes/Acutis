-- ============================================
-- MIGRATION 007: Tabela lead_tracking
-- Armazena origem dos leads (Facebook Ads, Google Ads, etc.)
-- ============================================

-- Tabela principal de tracking
CREATE TABLE IF NOT EXISTS public.lead_tracking (
  id BIGSERIAL PRIMARY KEY,
  chatid TEXT NOT NULL,                  -- ID do chat WhatsApp (ex: 5511999999999@s.whatsapp.net)
  owner TEXT NOT NULL,                   -- Owner da empresa (FK para config_empresas)
  origem TEXT NOT NULL,                  -- 'facebook_ads', 'instagram_ads', 'google_ads', 'organico'
  campanha_id TEXT,                      -- ID da campanha do anúncio (sourceID)
  source_app TEXT,                       -- 'facebook', 'instagram', 'google'
  ctwa_clid TEXT,                        -- Click-to-WhatsApp Click ID (atribuição)
  ad_body TEXT,                          -- Texto/corpo do anúncio
  ad_title TEXT,                         -- Título do anúncio
  primeira_mensagem TEXT,                -- Texto da primeira mensagem do lead
  detected_at TIMESTAMPTZ DEFAULT NOW(), -- Quando o tracking foi detectado
  
  -- Constraints
  CONSTRAINT fk_tracking_owner FOREIGN KEY (owner) 
    REFERENCES public.config_empresas(owner) ON DELETE CASCADE,
  CONSTRAINT unique_tracking_chatid_owner UNIQUE (chatid, owner)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tracking_owner ON public.lead_tracking(owner);
CREATE INDEX IF NOT EXISTS idx_tracking_origem ON public.lead_tracking(origem);
CREATE INDEX IF NOT EXISTS idx_tracking_owner_origem ON public.lead_tracking(owner, origem);
CREATE INDEX IF NOT EXISTS idx_tracking_detected_at ON public.lead_tracking(detected_at);
CREATE INDEX IF NOT EXISTS idx_tracking_campanha_id ON public.lead_tracking(campanha_id);

-- RLS (Row Level Security)
ALTER TABLE public.lead_tracking ENABLE ROW LEVEL SECURITY;

-- Comentários
COMMENT ON TABLE public.lead_tracking IS 'Tracking de origem dos leads (Facebook Ads, Instagram Ads, Google Ads, Orgânico)';
COMMENT ON COLUMN public.lead_tracking.origem IS 'Origem detectada: facebook_ads, instagram_ads, google_ads, organico';
COMMENT ON COLUMN public.lead_tracking.campanha_id IS 'ID da campanha do Meta Ads (sourceID do webhook)';
COMMENT ON COLUMN public.lead_tracking.ctwa_clid IS 'Click-to-WhatsApp Click ID para atribuição de conversões';

-- ============================================
-- Adicionar campo de configuração de análise por empresa
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'config_empresas' 
        AND column_name = 'analise_origem_filter'
    ) THEN
        ALTER TABLE public.config_empresas 
        ADD COLUMN analise_origem_filter TEXT DEFAULT 'trafego_pago';
        
        COMMENT ON COLUMN public.config_empresas.analise_origem_filter IS 
          'Filtro de origem para análise IA: trafego_pago, organico, todos';
    END IF;
END $$;
