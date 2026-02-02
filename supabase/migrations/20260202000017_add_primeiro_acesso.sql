-- Adiciona campo para controlar primeiro acesso
ALTER TABLE public.gestores
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.gestores.primeiro_acesso IS 'Se TRUE, usuário deve redefinir senha no próximo login';

-- Atualiza gestores existentes (já acessaram, então não é primeiro acesso)
UPDATE public.gestores SET primeiro_acesso = FALSE WHERE primeiro_acesso IS NULL;
