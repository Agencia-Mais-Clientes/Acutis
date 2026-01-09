-- ============================================
-- MIGRATION 008: Adicionar campos extras ao lead_tracking
-- Campos: ad_id (ID do anúncio), ad_media_url (URL do criativo)
-- ============================================

-- Adicionar campo ad_id (ID do anúncio)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_tracking' 
        AND column_name = 'ad_id'
    ) THEN
        ALTER TABLE public.lead_tracking 
        ADD COLUMN ad_id TEXT;
        
        COMMENT ON COLUMN public.lead_tracking.ad_id IS 
          'ID do anúncio específico (ex: 120239281641320629)';
    END IF;
END $$;

-- Adicionar campo ad_media_url (URL da mídia/criativo)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_tracking' 
        AND column_name = 'ad_media_url'
    ) THEN
        ALTER TABLE public.lead_tracking 
        ADD COLUMN ad_media_url TEXT;
        
        COMMENT ON COLUMN public.lead_tracking.ad_media_url IS 
          'URL da mídia do criativo do anúncio (Instagram/Facebook post URL)';
    END IF;
END $$;

-- Índice para buscar por ad_id
CREATE INDEX IF NOT EXISTS idx_tracking_ad_id ON public.lead_tracking(ad_id);
