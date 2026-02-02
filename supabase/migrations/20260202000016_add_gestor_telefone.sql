-- Adiciona campo de telefone para gestores
ALTER TABLE public.gestores
ADD COLUMN IF NOT EXISTS telefone TEXT DEFAULT NULL;

COMMENT ON COLUMN public.gestores.telefone IS 'Telefone do gestor para contato (formato: 5511999999999)';

-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_gestores_telefone ON public.gestores(telefone);
