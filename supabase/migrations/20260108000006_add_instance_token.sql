-- ============================================
-- MIGRATION 006: Adicionar campo instance_token
-- Token da instância UazAPI para cada empresa
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'config_empresas' 
        AND column_name = 'instance_token'
    ) THEN
        ALTER TABLE public.config_empresas ADD COLUMN instance_token TEXT;
        COMMENT ON COLUMN public.config_empresas.instance_token IS 'Token da instância UazAPI para verificar status do WhatsApp';
    END IF;
END $$;
