# 🚨 Alertas Críticos em Tempo Real

> **Status:** Planejado 📋  
> **Abordagem:** N8N + Webhook para Acutis  
> **Criado em:** 23/01/2026  
> **Última atualização:** 23/01/2026

## Visão Geral

Quando algo grave acontece, a Acutis interrompe o silêncio:

- Cliente muitas horas sem resposta
- Atendimento agressivo ou inadequado
- Risco claro de perda de venda

> 📲 **O gestor recebe alerta imediato no WhatsApp (~1-2 min de latência).**

---

## Arquitetura

### Problema Identificado

O webhook do Acutis (`/api/webhooks/uazapi`) só processa a **primeira mensagem** de cada chat para salvar o tracking. Mensagens subsequentes vão só para o N8N.

### Solução: N8N dispara webhook para Acutis

```
WhatsApp ──▶ UazAPI ──▶ N8N ──▶ Salva mensagem ──▶ Chama Acutis
                                   (Supabase)      (/api/trigger-analysis)
                                                          │
                                            Agenda análise pendente
                                                          │
                                            Cron cada 30-60s processa
                                                          │
                                                 Análise IA + Alertas
```

---

## Pré-requisitos

### ⚠️ Migração do Lead Tracking (PENDENTE)

Atualmente existem **dois sistemas** salvando no `lead_tracking`:

1. **N8N** → Node "insere lead" (workflow centralizado)
2. **Acutis** → Webhook `/api/webhooks/uazapi`

**Antes de implementar alertas:**

- [ ] Validar que o N8N está salvando corretamente no `lead_tracking`
- [ ] Desativar/remover o salvamento de `lead_tracking` no webhook Acutis
- [ ] Manter apenas o N8N como fonte única de verdade

---

## Implementação

### Fase 1: Criar endpoint no Acutis

**Novo arquivo: `src/app/api/trigger-analysis/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEBOUNCE_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const { chatid, owner } = await req.json();

    if (!chatid || !owner) {
      return NextResponse.json(
        { error: "chatid e owner obrigatórios" },
        { status: 400 },
      );
    }

    const agendadoPara = new Date(Date.now() + DEBOUNCE_SECONDS * 1000);

    const { error } = await supabaseAdmin.from("analise_pendente").upsert(
      {
        chatid,
        owner,
        agendado_para: agendadoPara.toISOString(),
        processado: false,
      },
      { onConflict: "chatid,owner" },
    );

    if (error) {
      console.error("[TRIGGER] Erro:", error);
      return NextResponse.json({ error: "Erro ao agendar" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      agendado_para: agendadoPara.toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
```

---

### Fase 2: Criar tabela de pendências

```sql
CREATE TABLE IF NOT EXISTS public.analise_pendente (
  id BIGSERIAL PRIMARY KEY,
  chatid TEXT NOT NULL,
  owner TEXT NOT NULL,
  agendado_para TIMESTAMPTZ NOT NULL,
  processado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_pendente_chat UNIQUE (chatid, owner)
);

CREATE INDEX idx_pendente_agendado ON public.analise_pendente(agendado_para)
  WHERE processado = false;
```

---

### Fase 3: Modificar N8N

Adicionar node **HTTP Request** após o "Create a row":

**Configuração:**
| Campo | Valor |
|-------|-------|
| Method | POST |
| URL | `https://SEU-DOMINIO.vercel.app/api/trigger-analysis` |
| Headers | `Content-Type: application/json` |

**Body JSON:**

```json
{
  "chatid": "={{ $('RECEBE A MESAGEM DAS 3 ROTAS1').item.json.remoteJid }}",
  "owner": "={{ $('Recebe mensagem do WhatsApp').item.json.body.owner }}"
}
```

**Node JSON para copiar:**

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://SEU-DOMINIO.vercel.app/api/trigger-analysis",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{ "name": "Content-Type", "value": "application/json" }]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"chatid\": \"{{ $('RECEBE A MESAGEM DAS 3 ROTAS1').item.json.remoteJid }}\",\n  \"owner\": \"{{ $('Recebe mensagem do WhatsApp').item.json.body.owner }}\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1256, -80],
  "id": "trigger-acutis-analysis",
  "name": "Trigger Acutis Analysis",
  "onError": "continueRegularOutput"
}
```

---

### Fase 4: Worker de processamento

**Arquivo: `src/app/api/process-pending/route.ts`**

Processa análises pendentes cujo debounce já passou, executa mini-análise IA e envia alertas.

---

### Fase 5: Análise rápida (mini-prompt)

Prompt otimizado (~500 tokens) para detectar apenas problemas críticos:

- Tempo de resposta alto
- Atendimento ruim
- Lead perdendo
- Objeção não tratada

---

### Fase 6: Cron

Vercel Cron ou N8N Schedule Trigger a cada 1 minuto chamando `/api/process-pending`.

---

## Estimativa

| Fase      | Descrição                    | Tempo       |
| --------- | ---------------------------- | ----------- |
| Pré-req   | Validar/migrar lead_tracking | 1-2h        |
| 1         | Endpoint trigger-analysis    | 1h          |
| 2         | Tabela analise_pendente      | 30min       |
| 3         | Modificar N8N                | 30min       |
| 4         | Worker process-pending       | 3h          |
| 5         | Mini-prompt                  | 2h          |
| 6         | Cron                         | 30min       |
| 7         | Envio alertas + histórico    | 2h          |
| **Total** |                              | **~10-12h** |

---

## Próximos Passos

1. [ ] **Validar N8N salvando lead_tracking corretamente**
2. [ ] Desativar salvamento de lead_tracking no webhook Acutis
3. [ ] Criar tabela `analise_pendente`
4. [ ] Criar endpoint `/api/trigger-analysis`
5. [ ] Adicionar node HTTP no N8N
6. [ ] Criar endpoint `/api/process-pending`
7. [ ] Criar libs `realtime-analysis.ts` e `alert-sender.ts`
8. [ ] Configurar cron
9. [ ] Adicionar campo `whatsapp_gestor`
10. [ ] Testar end-to-end
