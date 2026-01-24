-- ============================================
-- Migration: Etapas do Funil Personalizáveis
-- Data: 2026-01-23
-- Descrição: Permite configurar etapas do funil por empresa
-- ============================================

-- Tabela de etapas do funil
CREATE TABLE IF NOT EXISTS public.etapas_funil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner VARCHAR NOT NULL,
  nome VARCHAR(100) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  cor VARCHAR(20) DEFAULT '#3b82f6',
  pilar VARCHAR(20) NOT NULL CHECK (pilar IN ('vendas', 'suporte')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_etapas_funil_owner FOREIGN KEY (owner) REFERENCES public.config_empresas(owner) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_etapas_funil_owner ON public.etapas_funil(owner);
CREATE INDEX IF NOT EXISTS idx_etapas_funil_pilar ON public.etapas_funil(owner, pilar, ordem);

-- RLS
ALTER TABLE public.etapas_funil ENABLE ROW LEVEL SECURITY;

-- Policy: dono pode ver suas etapas
DROP POLICY IF EXISTS "Owner can view own etapas" ON public.etapas_funil;
CREATE POLICY "Owner can view own etapas" ON public.etapas_funil
  FOR SELECT USING (auth.uid()::text = owner OR current_setting('app.owner_id', true) = owner);

-- Policy: dono pode inserir suas etapas  
DROP POLICY IF EXISTS "Owner can insert own etapas" ON public.etapas_funil;
CREATE POLICY "Owner can insert own etapas" ON public.etapas_funil
  FOR INSERT WITH CHECK (auth.uid()::text = owner OR current_setting('app.owner_id', true) = owner);

-- Policy: dono pode atualizar suas etapas
DROP POLICY IF EXISTS "Owner can update own etapas" ON public.etapas_funil;
CREATE POLICY "Owner can update own etapas" ON public.etapas_funil
  FOR UPDATE USING (auth.uid()::text = owner OR current_setting('app.owner_id', true) = owner);

-- Policy: dono pode deletar suas etapas
DROP POLICY IF EXISTS "Owner can delete own etapas" ON public.etapas_funil;
CREATE POLICY "Owner can delete own etapas" ON public.etapas_funil
  FOR DELETE USING (auth.uid()::text = owner OR current_setting('app.owner_id', true) = owner);

-- ============================================
-- Função para criar etapas padrão
-- ============================================
CREATE OR REPLACE FUNCTION criar_etapas_funil_padrao()
RETURNS TRIGGER AS $$
BEGIN
  -- Etapas padrão de Vendas
  INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar) VALUES
    (NEW.owner, 'Lead Recebido', 1, '#6366f1', 'vendas'),
    (NEW.owner, 'Qualificado', 2, '#8b5cf6', 'vendas'),
    (NEW.owner, 'Agendado', 3, '#3b82f6', 'vendas'),
    (NEW.owner, 'Convertido', 4, '#10b981', 'vendas'),
    (NEW.owner, 'Perdido', 5, '#ef4444', 'vendas');
  
  -- Etapas padrão de Suporte
  INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar) VALUES
    (NEW.owner, 'Ticket Aberto', 1, '#f59e0b', 'suporte'),
    (NEW.owner, 'Em Atendimento', 2, '#3b82f6', 'suporte'),
    (NEW.owner, 'Resolvido', 3, '#10b981', 'suporte');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar etapas ao cadastrar nova empresa
DROP TRIGGER IF EXISTS trigger_criar_etapas_funil ON public.config_empresas;
CREATE TRIGGER trigger_criar_etapas_funil
  AFTER INSERT ON public.config_empresas
  FOR EACH ROW
  EXECUTE FUNCTION criar_etapas_funil_padrao();

-- ============================================
-- Inserir etapas padrão para empresas existentes
-- ============================================
INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Lead Recebido', 1, '#6366f1', 'vendas' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'vendas')
ON CONFLICT DO NOTHING;

INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Qualificado', 2, '#8b5cf6', 'vendas' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'vendas' AND nome = 'Qualificado')
ON CONFLICT DO NOTHING;

INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Agendado', 3, '#3b82f6', 'vendas' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'vendas' AND nome = 'Agendado')
ON CONFLICT DO NOTHING;

INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Convertido', 4, '#10b981', 'vendas' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'vendas' AND nome = 'Convertido')
ON CONFLICT DO NOTHING;

INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Perdido', 5, '#ef4444', 'vendas' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'vendas' AND nome = 'Perdido')
ON CONFLICT DO NOTHING;

-- Suporte
INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Ticket Aberto', 1, '#f59e0b', 'suporte' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'suporte')
ON CONFLICT DO NOTHING;

INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Em Atendimento', 2, '#3b82f6', 'suporte' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'suporte' AND nome = 'Em Atendimento')
ON CONFLICT DO NOTHING;

INSERT INTO public.etapas_funil (owner, nome, ordem, cor, pilar)
SELECT owner, 'Resolvido', 3, '#10b981', 'suporte' FROM public.config_empresas
WHERE owner NOT IN (SELECT DISTINCT owner FROM public.etapas_funil WHERE pilar = 'suporte' AND nome = 'Resolvido')
ON CONFLICT DO NOTHING;
