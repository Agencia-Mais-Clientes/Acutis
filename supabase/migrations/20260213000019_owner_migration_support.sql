-- ============================================
-- MIGRATION 019: Suporte a migração de Owner (WhatsApp)
-- Adiciona ON UPDATE CASCADE em FKs + tabela de histórico
-- ============================================

-- ============================================
-- 1. Tabela owner_historico (auditoria de trocas de número)
-- ============================================
CREATE TABLE IF NOT EXISTS public.owner_historico (
  id SERIAL PRIMARY KEY,
  owner_atual TEXT NOT NULL,           -- Número novo (após migração)
  owner_anterior TEXT NOT NULL,        -- Número antigo (antes da migração)
  migrado_em TIMESTAMPTZ DEFAULT NOW(),
  migrado_por TEXT                     -- Email/identificação do admin
);

COMMENT ON TABLE public.owner_historico IS 'Histórico de trocas de número WhatsApp (owner) das empresas';
COMMENT ON COLUMN public.owner_historico.owner_atual IS 'Número novo após a migração';
COMMENT ON COLUMN public.owner_historico.owner_anterior IS 'Número antigo antes da migração';

CREATE INDEX IF NOT EXISTS idx_owner_historico_atual ON public.owner_historico(owner_atual);
CREATE INDEX IF NOT EXISTS idx_owner_historico_anterior ON public.owner_historico(owner_anterior);

-- RLS: somente service_role acessa owner_historico
ALTER TABLE public.owner_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_owner_historico" ON public.owner_historico
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 2. Limpar registros órfãos (owners que não existem em config_empresas)
-- Necessário para poder criar as FKs sem erro
-- ============================================
DELETE FROM public.mensagens_clientes
  WHERE owner NOT IN (SELECT owner FROM public.config_empresas);

DELETE FROM public.analises_conversas
  WHERE owner NOT IN (SELECT owner FROM public.config_empresas);

DELETE FROM public.lead_tracking
  WHERE owner NOT IN (SELECT owner FROM public.config_empresas);

DELETE FROM public.etapas_funil
  WHERE owner NOT IN (SELECT owner FROM public.config_empresas);

DELETE FROM public.gestor_empresa
  WHERE empresa_owner NOT IN (SELECT owner FROM public.config_empresas);

DELETE FROM public.analise_pendente
  WHERE owner NOT IN (SELECT owner FROM public.config_empresas);

-- ============================================
-- 3. Recriar FKs com ON UPDATE CASCADE
-- ============================================

-- mensagens_clientes: fk_owner
ALTER TABLE public.mensagens_clientes DROP CONSTRAINT IF EXISTS fk_owner;
ALTER TABLE public.mensagens_clientes
  ADD CONSTRAINT fk_owner
  FOREIGN KEY (owner) REFERENCES public.config_empresas(owner)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- analises_conversas: fk_analise_owner
ALTER TABLE public.analises_conversas DROP CONSTRAINT IF EXISTS fk_analise_owner;
ALTER TABLE public.analises_conversas
  ADD CONSTRAINT fk_analise_owner
  FOREIGN KEY (owner) REFERENCES public.config_empresas(owner)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- lead_tracking: fk_tracking_owner
ALTER TABLE public.lead_tracking DROP CONSTRAINT IF EXISTS fk_tracking_owner;
ALTER TABLE public.lead_tracking
  ADD CONSTRAINT fk_tracking_owner
  FOREIGN KEY (owner) REFERENCES public.config_empresas(owner)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- etapas_funil: fk_etapas_funil_owner
ALTER TABLE public.etapas_funil DROP CONSTRAINT IF EXISTS fk_etapas_funil_owner;
ALTER TABLE public.etapas_funil
  ADD CONSTRAINT fk_etapas_funil_owner
  FOREIGN KEY (owner) REFERENCES public.config_empresas(owner)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- gestor_empresa: FK inline (nome gerado pelo Postgres)
-- Precisamos dropar pelo nome inferido e recriar
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.gestor_empresa'::regclass
    AND confrelid = 'public.config_empresas'::regclass
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.gestor_empresa DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.gestor_empresa
  ADD CONSTRAINT fk_gestor_empresa_owner
  FOREIGN KEY (empresa_owner) REFERENCES public.config_empresas(owner)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- analise_pendente: FK inline
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.analise_pendente'::regclass
    AND confrelid = 'public.config_empresas'::regclass
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.analise_pendente DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.analise_pendente
  ADD CONSTRAINT fk_analise_pendente_owner
  FOREIGN KEY (owner) REFERENCES public.config_empresas(owner)
  ON DELETE CASCADE ON UPDATE CASCADE;
