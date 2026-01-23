-- Migration: Add business hours configuration to config_empresas
-- This enables intelligent response time calculation that excludes non-working hours

-- Add business hours configuration (JSONB with schedule per weekday)
ALTER TABLE config_empresas
ADD COLUMN IF NOT EXISTS horario_funcionamento JSONB DEFAULT '{
  "segunda": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "terca": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "quarta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "quinta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "sexta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": true},
  "domingo": {"inicio": null, "fim": null, "ativo": false}
}'::jsonb;

-- Add timezone column for correct local time calculations
ALTER TABLE config_empresas
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';

-- Comment for documentation
COMMENT ON COLUMN config_empresas.horario_funcionamento IS 'Business hours configuration per weekday. Used to calculate fair response time.';
COMMENT ON COLUMN config_empresas.timezone IS 'Timezone for the company (IANA format). Default: America/Sao_Paulo';
