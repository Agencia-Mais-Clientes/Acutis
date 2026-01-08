-- ============================================
-- MIGRATION 005: Adicionar colunas novas (se não existirem)
-- Para bancos que já têm as tabelas criadas
-- ============================================

-- Adiciona coluna 'instrucoes_ia' em config_empresas (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'config_empresas' 
        AND column_name = 'instrucoes_ia'
    ) THEN
        ALTER TABLE public.config_empresas ADD COLUMN instrucoes_ia TEXT;
        COMMENT ON COLUMN public.config_empresas.instrucoes_ia IS 'Instruções personalizadas para a IA';
    END IF;
END $$;

-- Adiciona coluna 'ativo' em config_empresas (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'config_empresas' 
        AND column_name = 'ativo'
    ) THEN
        ALTER TABLE public.config_empresas ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Adiciona coluna 'msg_inicio_id' em analises_conversas (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analises_conversas' 
        AND column_name = 'msg_inicio_id'
    ) THEN
        ALTER TABLE public.analises_conversas ADD COLUMN msg_inicio_id BIGINT;
    END IF;
END $$;

-- Adiciona coluna 'msg_fim_id' em analises_conversas (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analises_conversas' 
        AND column_name = 'msg_fim_id'
    ) THEN
        ALTER TABLE public.analises_conversas ADD COLUMN msg_fim_id BIGINT;
    END IF;
END $$;
