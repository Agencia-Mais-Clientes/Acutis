# API de Análise Automática - Documentação

> **Base URL**: `https://www.acutisapp.com.br`  
> **Auth**: Bearer token via header `Authorization: Bearer <ANALYZE_API_TOKEN>` (se configurado)

---

## 1. `POST /api/cron/analyze` — Executar Análise

Endpoint principal de orquestração. Busca todas as empresas ativas e analisa chats pendentes.

### Body (JSON, todos opcionais)

| Campo           | Tipo   | Default | Descrição                                                                                |
| --------------- | ------ | ------- | ---------------------------------------------------------------------------------------- |
| `maxPerCompany` | number | `20`    | Máximo de chats por empresa por fase                                                     |
| `maxTotal`      | number | `100`   | Máximo total de chats na execução                                                        |
| `fromDate`      | string | `null`  | Data mínima ISO (ex: `"2026-01-01"`). Só analisa chats com mensagens a partir dessa data |
| `owner`         | string | `null`  | Owner específico (ex: `"5511940820844"`). Analisa só essa empresa ao invés de todas      |

### Exemplos de uso

**Análise padrão (cron automático — todas as empresas):**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"maxPerCompany": 20, "maxTotal": 100}'
```

**Análise de UMA empresa específica:**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"owner": "5511940820844", "maxPerCompany": 20, "maxTotal": 50}'
```

**Análise de uma empresa, só janeiro 2026 em diante:**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"owner": "5511940820844", "fromDate": "2026-01-01", "maxPerCompany": 20, "maxTotal": 50}'
```

**Análise somente de janeiro 2026 em diante:**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"maxPerCompany": 20, "maxTotal": 100, "fromDate": "2026-01-01"}'
```

**Teste rápido (poucos chats):**

```bash
curl -X POST "https://www.acutisapp.com.br/api/cron/analyze" \
  -H "Content-Type: application/json" \
  -d '{"maxPerCompany": 2, "maxTotal": 5}'
```

**PowerShell (Windows):**

```powershell
Invoke-RestMethod -Uri "https://www.acutisapp.com.br/api/cron/analyze" `
  -Method POST -ContentType "application/json" `
  -Body '{"maxPerCompany": 20, "maxTotal": 100, "fromDate": "2026-01-01"}'
```

### Resposta de sucesso

```json
{
  "success": true,
  "companies": [
    {
      "owner": "5511940820844",
      "empresa": "Nome Empresa",
      "trafegoPago": { "processed": 5, "skipped": 0, "errors": 0 },
      "organico": { "processed": 3, "skipped": 1, "errors": 0 }
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

---

## 2. `GET /api/cron/analyze` — Health Check

Verifica se o sistema está rodando e lista empresas ativas.

```bash
curl "https://www.acutisapp.com.br/api/cron/analyze"
```

### Resposta

```json
{
  "success": true,
  "message": "Cron Analyze API is running",
  "activeCompanies": 46,
  "companiesList": [
    {
      "owner": "5511940820844",
      "empresa": "Nome Empresa",
      "ativo": true,
      "origemFilter": "trafego_pago"
    }
  ]
}
```

---

## 3. `POST /api/analyze-conversations/single` — Análise Unitária

Analisa um chat específico.

### Body

```json
{
  "owner": "5511940820844",
  "chatid": "5511999999999@s.whatsapp.net"
}
```

---

## Configuração N8N

### Workflow: 2 nós

```
[Schedule Trigger] → [HTTP Request]
```

1. **Schedule Trigger**
   - Intervalo: A cada 2 horas
   - Horários: 08, 10, 12, 14, 16, 18, 20
   - Timezone: America/Sao_Paulo

2. **HTTP Request**
   - Method: `POST`
   - URL: `https://www.acutisapp.com.br/api/cron/analyze`
   - Content-Type: `application/json`
   - Body:
     ```json
     {
       "maxPerCompany": 20,
       "maxTotal": 100,
       "fromDate": "2026-01-01"
     }
     ```
   - Timeout: `60000` (60 segundos — limite Hobby)

### Variáveis de Ambiente (Vercel)

| Variável            | Obrigatório | Descrição                                                                                                |
| ------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `ANALYZE_API_TOKEN` | Não         | Token de autenticação. Se definido, todas as chamadas precisam do header `Authorization: Bearer <token>` |

---

## Como funciona internamente

```
POST /api/cron/analyze
│
├─ 1. Busca empresas ativas (config_empresas.ativo = true)
│
├─ 2. Para CADA empresa:
│   ├─ Fase 1: Tráfego Pago (prioridade)
│   │   └─ Busca chats com mensagens NOVAS após última análise
│   │       └─ Processa cada chat (Gemini AI) com 5s de delay
│   │
│   └─ Fase 2: Orgânicos
│       └─ Mesmo processo
│
├─ 3. Safety checks:
│   ├─ Max chats por empresa (default: 20)
│   ├─ Max chats total (default: 100)
│   └─ Time budget: para 50s antes do timeout
│
└─ 4. Retorna relatório completo
```

### Lógica de "mensagens novas"

Um chat é considerado **pendente** se:

- **Nunca foi analisado** (nenhuma análise na tabela `analises_conversas`)
- **Tem mensagens novas** após a última análise (compara `mensagem.id > analise.msg_fim_id`)

Isso garante que chats com novas mensagens sejam re-analisados, mesmo que já tenham sido analisados antes.
