-- ============================================
-- MIGRATION 002: Tabela mensagens_clientes
-- Armazena todas as mensagens do WhatsApp
-- ============================================

CREATE TABLE IF NOT EXISTS public.mensagens_clientes (
  id BIGSERIAL PRIMARY KEY,
  chatid TEXT NOT NULL,                -- ID do chat (ex: 5511999999999@s.whatsapp.net)
  owner TEXT NOT NULL,                 -- Owner da empresa (FK para config_empresas)
  mensagem TEXT,                       -- Conteúdo da mensagem (pode ser NULL para mídia)
  from_me BOOLEAN DEFAULT false,       -- Se a mensagem foi enviada pela empresa
  timestamp BIGINT,                    -- Timestamp em segundos
  timestamp_ms BIGINT,                 -- Timestamp em milissegundos
  recebido_em TIMESTAMPTZ DEFAULT NOW(),
  
  -- FK para garantir integridade
  CONSTRAINT fk_owner FOREIGN KEY (owner) REFERENCES public.config_empresas(owner) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_chatid ON public.mensagens_clientes(chatid);
CREATE INDEX IF NOT EXISTS idx_mensagens_owner ON public.mensagens_clientes(owner);
CREATE INDEX IF NOT EXISTS idx_mensagens_recebido_em ON public.mensagens_clientes(recebido_em);
CREATE INDEX IF NOT EXISTS idx_mensagens_owner_chatid ON public.mensagens_clientes(owner, chatid);

-- Comentários
COMMENT ON TABLE public.mensagens_clientes IS 'Mensagens brutas do WhatsApp capturadas via N8N/UAZAPI';
COMMENT ON COLUMN public.mensagens_clientes.chatid IS 'Identificador do chat no formato WhatsApp';
COMMENT ON COLUMN public.mensagens_clientes.from_me IS 'True = mensagem da empresa, False = mensagem do cliente';
