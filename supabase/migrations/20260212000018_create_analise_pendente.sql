-- Migration: Cria tabela analise_pendente para alertas em tempo real
-- Descrição: Fila de debounce para mini-análises de alerta via Gemini

-- Tabela analise_pendente: fila de chats aguardando mini-análise de alerta
CREATE TABLE IF NOT EXISTS public.analise_pendente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatid TEXT NOT NULL,
  owner TEXT NOT NULL REFERENCES public.config_empresas(owner) ON DELETE CASCADE,
  agendado_para TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 seconds'),
  processado BOOLEAN NOT NULL DEFAULT false,
  resultado_alerta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chatid, owner)
);

COMMENT ON TABLE public.analise_pendente IS 'Fila de debounce para alertas em tempo real. Cada registro representa um chat aguardando mini-análise.';
COMMENT ON COLUMN public.analise_pendente.agendado_para IS 'Timestamp para processamento (now + 60s debounce). Resetado a cada nova mensagem.';
COMMENT ON COLUMN public.analise_pendente.processado IS 'Se true, já foi processado pelo worker.';
COMMENT ON COLUMN public.analise_pendente.resultado_alerta IS 'Resultado da mini-análise: {needsAlert, alertType, alertMessage, severity, detectedIssues}';

-- Index parcial para buscar pendentes de forma eficiente
CREATE INDEX IF NOT EXISTS idx_analise_pendente_agendado
  ON public.analise_pendente (agendado_para)
  WHERE processado = false;

-- Reutiliza trigger de updated_at (já criado na migration 20260202000015)
CREATE TRIGGER set_updated_at_analise_pendente
  BEFORE UPDATE ON public.analise_pendente
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: desabilitado para esta tabela (acesso apenas via service role)
ALTER TABLE public.analise_pendente ENABLE ROW LEVEL SECURITY;

-- Policy para service role (admin)
CREATE POLICY "Service role full access on analise_pendente"
  ON public.analise_pendente
  FOR ALL
  USING (true)
  WITH CHECK (true);
