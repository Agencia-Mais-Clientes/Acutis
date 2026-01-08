-- ============================================
-- MIGRATION 003: Tabela analises_conversas
-- Armazena as análises feitas pela IA
-- ============================================

CREATE TABLE IF NOT EXISTS public.analises_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatid TEXT NOT NULL,                -- ID do chat analisado
  owner TEXT NOT NULL,                 -- Owner da empresa
  msg_inicio_id BIGINT,                -- ID da primeira mensagem do bloco analisado
  msg_fim_id BIGINT,                   -- ID da última mensagem do bloco analisado (cursor)
  resultado_ia JSONB NOT NULL,         -- Resultado da análise da IA (JSON estruturado)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- FK para garantir integridade
  CONSTRAINT fk_analise_owner FOREIGN KEY (owner) REFERENCES public.config_empresas(owner) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analises_chatid ON public.analises_conversas(chatid);
CREATE INDEX IF NOT EXISTS idx_analises_owner ON public.analises_conversas(owner);
CREATE INDEX IF NOT EXISTS idx_analises_created_at ON public.analises_conversas(created_at);
CREATE INDEX IF NOT EXISTS idx_analises_owner_created ON public.analises_conversas(owner, created_at DESC);

-- Índice GIN para buscas no JSONB
CREATE INDEX IF NOT EXISTS idx_analises_resultado_ia ON public.analises_conversas USING GIN (resultado_ia);

-- Comentários
COMMENT ON TABLE public.analises_conversas IS 'Análises de conversas feitas pela IA Gemini';
COMMENT ON COLUMN public.analises_conversas.resultado_ia IS 'JSON com tipo_conversacao, temperatura, funil_fase, nota, objeções, etc';
COMMENT ON COLUMN public.analises_conversas.msg_fim_id IS 'Último ID processado - usado como cursor para não reprocessar';
