-- Adiciona coluna para gestor responsável
ALTER TABLE config_empresas 
ADD COLUMN IF NOT EXISTS gestor_responsavel TEXT DEFAULT NULL;

COMMENT ON COLUMN config_empresas.gestor_responsavel IS 'Nome do gestor responsável pela conta.';
