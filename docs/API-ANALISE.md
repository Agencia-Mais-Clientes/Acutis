# 📊 API de Análise Automática de Conversas — Acutis

> Documentação completa dos endpoints de análise automática de leads via WhatsApp.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
  - [POST /api/cron/analyze — Executar Análise](#1-post-apicronanalyze--executar-análise)
  - [GET /api/cron/analyze — Health Check](#2-get-apicronanalyze--health-check)
  - [POST /api/analyze-conversations/single — Análise Unitária](#3-post-apianalyze-conversationssingle--análise-unitária)
  - [POST /api/analyze-conversations — Análise em Lote (Legado)](#4-post-apianalyze-conversations--análise-em-lote-legado)
- [Configuração N8N](#configuração-n8n)
- [Funcionamento Interno](#funcionamento-interno)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de análise automática usa IA (Google Gemini) para analisar conversas de WhatsApp e gerar relatórios de qualidade de atendimento, classificação de leads e recomendações.

**Base URL:** `https://www.acutisapp.com.br`

**Fluxo simplificado:**

```
N8N (cron a cada 2h)
  → POST /api/cron/analyze
    → Busca empresas ativas
    → Para cada empresa:
      → Busca chats com mensagens novas
      → Envia para Gemini (IA)
      → Salva análise no banco
    → Retorna relatório
```

---

## Autenticação

A autenticação é via **Bearer Token** no header `Authorization`.

```
Authorization: Bearer <ANALYZE_API_TOKEN>
```

- O token é definido pela variável de ambiente `ANALYZE_API_TOKEN` na Vercel.
- **Se a variável NÃO estiver configurada**, os endpoints funcionam sem autenticação.
- **Se a variável ESTIVER configurada**, toda chamada sem o header correto retorna `401 Unauthorized`.

> ⚠️ **Recomendação:** Configure o token em produção para evitar chamadas não autorizadas.

---

## Endpoints

### 1. `POST /api/cron/analyze` — Executar Análise

Endpoint principal de orquestração. Busca empresas ativas e analisa chats pendentes automaticamente.

#### Parâmetros (Body JSON — todos opcionais)

| Campo           | Tipo     | Default | Descrição                                                                                                                  |
| --------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `owner`         | `string` | `null`  | Número do owner da empresa (ex: `"5511940820844"`). Se fornecido, analisa **somente** essa empresa. Se não, analisa todas. |
| `fromDate`      | `string` | `null`  | Data mínima no formato ISO (ex: `"2026-01-01"`). Só considera chats com mensagens a partir dessa data.                     |
| `maxPerCompany` | `number` | `20`    | Máximo de chats analisados **por empresa** em cada fase (tráfego pago e orgânico).                                         |
| `maxTotal`      | `number` | `100`   | Máximo total de chats analisados em toda a execução.                                                                       |

#### Exemplos de Chamada

**Analisar todas as empresas (uso padrão pelo cron):**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"maxPerCompany": 20, "maxTotal": 100}'
```

**Analisar uma empresa específica pelo owner:**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"owner": "5511940820844", "maxPerCompany": 20, "maxTotal": 50}'
```

**Analisar uma empresa a partir de janeiro 2026:**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"owner": "5511940820844", "fromDate": "2026-01-01", "maxPerCompany": 20, "maxTotal": 50}'
```

**Teste rápido (poucos chats para validar):**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"maxPerCompany": 2, "maxTotal": 5}'
```

**Com autenticação (se ANALYZE_API_TOKEN estiver configurado):**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"maxPerCompany": 20, "maxTotal": 100}'
```

**PowerShell (Windows):**

```powershell
Invoke-RestMethod -Uri "https://www.acutisapp.com.br/api/cron/analyze" `
  -Method POST -ContentType "application/json" `
  -Body '{"owner": "5511940820844", "fromDate": "2026-01-01", "maxPerCompany": 20, "maxTotal": 50}'
```

#### Resposta de Sucesso (200)

```json
{
  "success": true,
  "companies": [
    {
      "owner": "5511940820844",
      "empresa": "Gaviões Sapopemba",
      "trafegoPago": {
        "processed": 5,
        "skipped": 0,
        "errors": 0
      },
      "organico": {
        "processed": 3,
        "skipped": 1,
        "errors": 0
      }
    }
  ],
  "totalProcessed": 8,
  "totalErrors": 0,
  "totalSkipped": 1,
  "companiesProcessed": 1,
  "companiesTotal": 46,
  "durationMs": 45000
}
```

| Campo                | Descrição                                          |
| -------------------- | -------------------------------------------------- |
| `companies`          | Array com relatório de cada empresa processada     |
| `totalProcessed`     | Total de chats analisados com sucesso              |
| `totalErrors`        | Total de chats que deram erro na análise           |
| `totalSkipped`       | Total de chats pulados (sem mensagens suficientes) |
| `companiesProcessed` | Quantas empresas foram de fato processadas         |
| `companiesTotal`     | Total de empresas ativas no sistema                |
| `durationMs`         | Tempo total de execução em milissegundos           |

#### Respostas de Erro

| Status | Quando                                                         |
| ------ | -------------------------------------------------------------- |
| `401`  | Token de autenticação inválido ou ausente (quando configurado) |
| `404`  | `owner` fornecido não encontrado ou empresa inativa            |
| `500`  | Erro interno do servidor                                       |

---

### 2. `GET /api/cron/analyze` — Health Check

Verifica se o sistema está rodando e lista todas as empresas ativas com seus owners.

**Muito útil para descobrir o `owner` de cada empresa.**

```bash
curl "https://www.acutisapp.com.br/api/cron/analyze"
```

#### Resposta

```json
{
  "success": true,
  "message": "Cron Analyze API is running",
  "activeCompanies": 46,
  "companiesList": [
    {
      "owner": "5511940820844",
      "empresa": "Gaviões Sapopemba",
      "ativo": true,
      "origemFilter": "trafego_pago"
    },
    {
      "owner": "5511910519949",
      "empresa": "Winner Fit Granja",
      "ativo": true,
      "origemFilter": "todos"
    }
  ]
}
```

| Campo             | Descrição                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `activeCompanies` | Número total de empresas ativas                                      |
| `companiesList`   | Lista com owner, nome, status e filtro de origem de cada empresa     |
| `origemFilter`    | Filtro de origem configurado: `trafego_pago`, `organico`, ou `todos` |

---

### 3. `POST /api/analyze-conversations/single` — Análise Unitária

Analisa **um único chat** específico. Útil para re-analisar manualmente uma conversa.

#### Body

```json
{
  "owner": "5511940820844",
  "chatid": "5511999999999@s.whatsapp.net"
}
```

#### Resposta

```json
{
  "success": true,
  "status": "success",
  "message": "Chat analisado com sucesso",
  "chatid": "5511999999999@s.whatsapp.net"
}
```

---

### 4. `POST /api/analyze-conversations` — Análise em Lote (Legado)

Endpoint legado que processa múltiplos chats pendentes. **Preferir usar o `/api/cron/analyze`** por ter mais controle.

#### Body

```json
{
  "ownerId": "5511940820844",
  "limit": 10
}
```

---

## Configuração N8N

### Workflow Recomendado: 2 nós

```
┌──────────────────┐     ┌──────────────────┐
│  Schedule Trigger │────▶│   HTTP Request    │
│   (a cada 2h)     │     │   POST /analyze   │
└──────────────────┘     └──────────────────┘
```

### Nó 1: Schedule Trigger

| Configuração | Valor                         |
| ------------ | ----------------------------- |
| Tipo         | Cron                          |
| Expressão    | `0 8,10,12,14,16,18,20 * * *` |
| Timezone     | `America/Sao_Paulo`           |

Isso roda a cada 2 horas, entre 08h e 20h.

### Nó 2: HTTP Request

| Configuração | Valor                                           |
| ------------ | ----------------------------------------------- |
| Method       | `POST`                                          |
| URL          | `https://www.acutisapp.com.br/api/cron/analyze` |
| Content-Type | `application/json`                              |
| Timeout      | `60000` (60 segundos — limite do plano Hobby)   |

**Body:**

```json
{
  "maxPerCompany": 20,
  "maxTotal": 100,
  "fromDate": "2026-01-01"
}
```

**Se tiver token de autenticação, adicione o header:**

```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## Funcionamento Interno

### Prioridade de Análise

1. **Tráfego Pago** (Facebook Ads, Instagram Ads, Google Ads) — processado primeiro
2. **Orgânico** — processado depois, se ainda tiver budget

A prioridade é definida pelo campo `analise_origem_filter` na tabela `config_empresas`.

### Lógica de "Mensagens Novas"

Um chat é considerado **pendente de análise** quando:

| Situação                                                         | Resultado        |
| ---------------------------------------------------------------- | ---------------- |
| Chat **nunca** foi analisado                                     | ✅ Entra na fila |
| Chat já analisado, **sem** mensagens novas                       | ❌ Ignorado      |
| Chat já analisado, **com** mensagens novas após a última análise | ✅ Entra na fila |

A verificação é feita comparando o `msg_fim_id` (ID da última mensagem processada na análise anterior) com o ID das mensagens atuais. Se existem mensagens com `id > msg_fim_id`, o chat tem conteúdo novo.

### Limites de Segurança

| Limite          | Default | Descrição                                         |
| --------------- | ------- | ------------------------------------------------- |
| `maxPerCompany` | 20      | Chats por empresa por fase                        |
| `maxTotal`      | 100     | Chats totais na execução                          |
| Time Budget     | 250s    | Para 50 segundos antes do timeout                 |
| Rate Limiting   | 5s      | Delay entre cada análise (respeita API do Gemini) |

### Tabelas do Banco de Dados Envolvidas

| Tabela               | Uso                                                       |
| -------------------- | --------------------------------------------------------- |
| `config_empresas`    | Lista de empresas ativas e suas configurações             |
| `mensagens_clientes` | Mensagens recebidas do WhatsApp                           |
| `analises_conversas` | Análises geradas pela IA                                  |
| `lead_tracking`      | Rastreamento de origem dos leads (tráfego pago, orgânico) |

---

## Troubleshooting

### A análise não está processando nenhum chat

1. Verifique se a empresa está **ativa**: `GET /api/cron/analyze` → procure na `companiesList`
2. Verifique se há mensagens novas: a análise só processa chats com mensagens após o último `msg_fim_id`
3. Verifique o `fromDate`: se estiver muito recente, pode não ter mensagens nesse período

### Timeout (504 Gateway Timeout)

- No plano **Hobby** da Vercel, o timeout máximo é **60 segundos**
- Isso limita a ~5-8 chats por execução
- Solução: diminua `maxTotal` ou aumente a frequência do cron no N8N

### Erro 401 Unauthorized

- Verifique se o token no header `Authorization` corresponde ao `ANALYZE_API_TOKEN` configurado na Vercel
- Formato correto: `Authorization: Bearer meu_token_secreto`

### Erro 404 (owner não encontrado)

- Verifique se o `owner` está correto fazendo `GET /api/cron/analyze`
- Verifique se a empresa está com `ativo = true` no banco

### Rate Limit do Gemini (429)

- O sistema tem retry automático com backoff exponencial (3 tentativas)
- Se persistir, aumente o intervalo entre execuções do cron

---

## Variáveis de Ambiente

| Variável                       | Obrigatória | Onde   | Descrição                                      |
| ------------------------------ | ----------- | ------ | ---------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ Sim      | Vercel | Chave da API do Google Gemini para análise IA  |
| `NEXT_PUBLIC_SUPABASE_URL`     | ✅ Sim      | Vercel | URL do projeto Supabase                        |
| `SUPABASE_SERVICE_ROLE_KEY`    | ✅ Sim      | Vercel | Chave de serviço do Supabase (acesso admin)    |
| `ANALYZE_API_TOKEN`            | ❌ Não      | Vercel | Token de autenticação dos endpoints de análise |
