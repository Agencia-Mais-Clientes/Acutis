-- ============================================
-- MIGRATION 015: Tabela gestores + gestor_empresa
-- Sistema de autenticação com roles para Super Admin
-- ============================================

-- Enum para roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'gestor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tabela principal de gestores
CREATE TABLE IF NOT EXISTS public.gestores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'gestor',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento N:N gestor <-> empresa
CREATE TABLE IF NOT EXISTS public.gestor_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestor_id UUID REFERENCES public.gestores(id) ON DELETE CASCADE,
  empresa_owner TEXT REFERENCES public.config_empresas(owner) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gestor_id, empresa_owner)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gestores_user_id ON public.gestores(user_id);
CREATE INDEX IF NOT EXISTS idx_gestores_email ON public.gestores(email);
CREATE INDEX IF NOT EXISTS idx_gestores_role ON public.gestores(role);
CREATE INDEX IF NOT EXISTS idx_gestor_empresa_gestor ON public.gestor_empresa(gestor_id);
CREATE INDEX IF NOT EXISTS idx_gestor_empresa_owner ON public.gestor_empresa(empresa_owner);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gestores_updated_at ON public.gestores;
CREATE TRIGGER update_gestores_updated_at
  BEFORE UPDATE ON public.gestores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.gestores IS 'Usuários gestores do sistema com roles (super_admin/gestor)';
COMMENT ON COLUMN public.gestores.user_id IS 'FK para auth.users do Supabase';
COMMENT ON COLUMN public.gestores.role IS 'Papel do usuário: super_admin tem acesso total, gestor tem acesso restrito';
COMMENT ON TABLE public.gestor_empresa IS 'Relacionamento N:N entre gestores e empresas que gerenciam';

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE public.gestores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestor_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas para gestores
DROP POLICY IF EXISTS "Super admin pode tudo em gestores" ON public.gestores;
CREATE POLICY "Super admin pode tudo em gestores"
ON public.gestores FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gestores g 
    WHERE g.user_id = auth.uid() AND g.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Gestor pode ver proprio registro" ON public.gestores;
CREATE POLICY "Gestor pode ver proprio registro"
ON public.gestores FOR SELECT
USING (user_id = auth.uid());

-- Políticas para gestor_empresa
DROP POLICY IF EXISTS "Super admin pode tudo em gestor_empresa" ON public.gestor_empresa;
CREATE POLICY "Super admin pode tudo em gestor_empresa"
ON public.gestor_empresa FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gestores g 
    WHERE g.user_id = auth.uid() AND g.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Gestor ve apenas suas vinculacoes" ON public.gestor_empresa;
CREATE POLICY "Gestor ve apenas suas vinculacoes"
ON public.gestor_empresa FOR SELECT
USING (
  gestor_id IN (
    SELECT id FROM public.gestores WHERE user_id = auth.uid()
  )
);
