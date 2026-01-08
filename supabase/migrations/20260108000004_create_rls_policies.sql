-- ============================================
-- MIGRATION 004: Row Level Security (RLS)
-- Políticas de segurança para multi-tenant
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.config_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analises_conversas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas para SERVICE ROLE (acesso total)
-- O backend usa service_role para operações
-- ============================================

-- config_empresas: service_role pode tudo
CREATE POLICY "service_role_all_config" ON public.config_empresas
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- mensagens_clientes: service_role pode tudo
CREATE POLICY "service_role_all_mensagens" ON public.mensagens_clientes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- analises_conversas: service_role pode tudo
CREATE POLICY "service_role_all_analises" ON public.analises_conversas
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Políticas para ANON (acesso público limitado)
-- Para webhooks e integrações externas
-- ============================================

-- analises_conversas: anon pode inserir (webhooks)
CREATE POLICY "anon_insert_analises" ON public.analises_conversas
  FOR INSERT
  WITH CHECK (true);

-- mensagens_clientes: anon pode inserir (webhooks N8N)
CREATE POLICY "anon_insert_mensagens" ON public.mensagens_clientes
  FOR INSERT
  WITH CHECK (true);
