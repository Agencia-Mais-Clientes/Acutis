-- ============================================
-- MIGRATION 020: Função RPC para migração de Owner
-- Resolve timeout do CASCADE em tabelas grandes
-- ============================================

CREATE OR REPLACE FUNCTION public.migrate_owner(
  p_old_owner TEXT,
  p_new_owner TEXT,
  p_migrado_por TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
BEGIN
  -- Valida que o owner antigo existe
  IF NOT EXISTS (SELECT 1 FROM public.config_empresas WHERE owner = p_old_owner) THEN
    RETURN json_build_object('success', false, 'error', 'Owner antigo não encontrado');
  END IF;

  -- Valida que o novo owner não existe
  IF EXISTS (SELECT 1 FROM public.config_empresas WHERE owner = p_new_owner) THEN
    RETURN json_build_object('success', false, 'error', 'Novo owner já existe');
  END IF;

  -- Atualiza o owner (CASCADE propaga para todas as tabelas filhas)
  UPDATE public.config_empresas
  SET owner = p_new_owner
  WHERE owner = p_old_owner;

  -- Registra no histórico
  INSERT INTO public.owner_historico (owner_atual, owner_anterior, migrado_por)
  VALUES (p_new_owner, p_old_owner, p_migrado_por);

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.migrate_owner IS 'Migra o owner de uma empresa com timeout estendido (60s) para suportar CASCADE em tabelas grandes';

-- Apenas service_role pode executar
REVOKE ALL ON FUNCTION public.migrate_owner FROM PUBLIC;
REVOKE ALL ON FUNCTION public.migrate_owner FROM anon;
REVOKE ALL ON FUNCTION public.migrate_owner FROM authenticated;
