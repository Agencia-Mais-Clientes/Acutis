-- Adiciona coluna para dia de envio de relatório (1=Segunda, ..., 7=Domingo)
ALTER TABLE config_empresas 
ADD COLUMN IF NOT EXISTS dia_relatorio INTEGER DEFAULT NULL;

COMMENT ON COLUMN config_empresas.dia_relatorio IS 'Dia da semana para envio do relatório (1=Segunda, 7=Domingo). NULL = não envia.';
