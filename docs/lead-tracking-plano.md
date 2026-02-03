# Lead Tracking - Plano de Implementação

## Resumo

Sistema para rastrear origem dos leads (Facebook Ads, Instagram Ads, Google Ads, Orgânico) e garantir análises corretas.

---

## Problema Identificado

| Situação               | Problema                                                  |
| ---------------------- | --------------------------------------------------------- |
| Leads trackeados       | Payload de anúncio vai apenas pra planilha, não pro banco |
| Análise IA             | Tenta inferir origem pela conversa, pode errar            |
| Tabela `lead_tracking` | Incompleta ou vazia                                       |

---

## Solução Implementada

### Novo Fluxo (Lead Tracking como Fonte Primária)

```
┌─────────────┐      ┌───────────────┐      ┌─────────────┐
│  Payload    │ ───► │ lead_tracking │ ───► │  Planilha   │
│  (Anúncio)  │      │  (Supabase)   │      │  (Sheets)   │
└─────────────┘      └───────────────┘      └─────────────┘
                            ▲
                            │
                     Fonte de Verdade
```

---

## Tabela `lead_tracking`

**Campos principais:**

- `chatid` - Telefone no formato WhatsApp (`5511999999999@s.whatsapp.net`)
- `owner` - Número do WhatsApp Business (`5511910966475`)
- `origem` - `facebook_ads`, `instagram_ads`, `google_ads`, `organico`
- `primeira_mensagem` - Texto da primeira mensagem
- `detected_at` - Data/hora de entrada

**Constraint:** `UNIQUE (chatid, owner)` - evita duplicidade automática

---

## Plano de Ação

### Passo 1: Importar Planilha Existente

Rodar N8N uma vez para migrar leads da planilha pro `lead_tracking`:

```
Google Sheets (ler tudo) → Loop → Supabase UPSERT lead_tracking
```

**Mapeamento de campos:**

| Planilha             | Campo DB                                    |
| -------------------- | ------------------------------------------- |
| TELEFONE             | `chatid` (adicionar `@s.whatsapp.net`)      |
| ORIGEM               | `origem` (converter: Facebook→facebook_ads) |
| DATA                 | `detected_at`                               |
| PRIMEIRA MENSAGEM... | `primeira_mensagem`                         |
| _(fixo)_             | `owner` = `5511910966475`                   |

**Conversão de origem:**

- `Facebook` → `facebook_ads`
- `Instagram` → `instagram_ads`
- `google` → `google_ads`
- _(vazio)_ → `organico`

### Passo 2: Novos Leads (direto pro lead_tracking)

Modificar automação existente:

```
Payload Anúncio → Supabase UPSERT lead_tracking
```

A planilha pode continuar recebendo em paralelo - o UPSERT evita duplicidade.

---

## Configuração N8N - Supabase UPSERT

**Operation:** Upsert  
**Table:** `lead_tracking`  
**Conflict Fields:** `chatid, owner`

| Campo               | Expressão                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `chatid`            | `{{ $json.TELEFONE }}@s.whatsapp.net`                                                                                             |
| `owner`             | `5511910966475`                                                                                                                   |
| `origem`            | `{{ {"facebook":"facebook_ads","instagram":"instagram_ads","google":"google_ads"}[$json.ORIGEM.toLowerCase()] \|\| "organico" }}` |
| `primeira_mensagem` | `{{ $json["PRIMEIRA MENSAGEM QUE A PESSOA ENVIOU"] }}`                                                                            |

---

## Como o Acutis Usa o Lead Tracking

No `analyze-service.ts`:

```typescript
// PRIMEIRO busca no lead_tracking
const origemLead = await getLeadOrigin(chat.chatid, chat.owner);

// Se está no lead_tracking com tráfego pago, FORÇA tipo = Vendas
if (isTrafegoPago(origemLead)) {
  resultado.tipo_conversacao = "Vendas";
}
```

**Prioridade:**

1. Se existe no `lead_tracking` → usa origem de lá (100% confiável)
2. Se NÃO existe → IA tenta inferir pela conversa

---

## API Criada

**Endpoint:** `POST /api/lead-tracking`

Aceita origem no formato da planilha (Facebook, Instagram, google) e converte automaticamente.

```json
{
  "telefone": "5511953387475",
  "owner": "5511910966475",
  "origem": "Facebook",
  "primeira_mensagem": "Olá! Vi o seu anúncio..."
}
```

---

## Estrutura da Planilha

| Coluna | Campo                                 |
| ------ | ------------------------------------- |
| A      | DATA                                  |
| B      | NOME                                  |
| C      | TELEFONE                              |
| E      | ORIGEM                                |
| F      | PRIMEIRA MENSAGEM QUE A PESSOA ENVIOU |

---

## Próximos Passos

- [ ] Rodar importação da planilha existente pro `lead_tracking`
- [ ] Configurar automação de novos leads direto pro `lead_tracking`
- [ ] (Opcional) Criar sync do `lead_tracking` → planilha
