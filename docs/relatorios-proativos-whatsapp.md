# 📊 Relatórios Proativos via WhatsApp

> **Status:** Viável ✅  
> **Criado em:** 23/01/2026  
> **Última atualização:** 23/01/2026

## Visão Geral

**Perfil validado:**

- Donos e gestores não querem entrar em plataforma
- Querem informação pronta e objetiva

**Solução:**

- Relatório semanal enviado automaticamente no WhatsApp
- Com: Resumo das vendas, principais erros, principais acertos, gráfico simples

> 📌 **A ferramenta não espera o gestor sentir dor — ela provoca.**

---

## Status Atual

### Já Existe no Sistema

| Componente              | Status     | Arquivo                             |
| ----------------------- | ---------- | ----------------------------------- |
| API de Relatório Diário | ✅ Pronto  | `src/app/api/daily-report/route.ts` |
| Cálculo de métricas     | ✅ Pronto  | Vendas, conversão, objeções, notas  |
| Mensagem de resumo      | ✅ Pronto  | Texto pronto para envio             |
| Integração UazAPI       | ⚠️ Parcial | `src/lib/uazapi.ts` (só leitura)    |
| Envio de mensagens      | ❌ Falta   | Precisa implementar                 |
| Agendador (cron)        | ❌ Falta   | Precisa configurar                  |
| Geração de gráfico      | ❌ Falta   | Precisa implementar                 |

### O que o `/api/daily-report` já retorna:

```json
{
  "empresa": "Nome da Empresa",
  "periodo": "Últimas 24h",
  "metricas": {
    "total_atendimentos": 45,
    "vendas": 30,
    "suporte": 15,
    "taxa_conversao": 23,
    "nota_media": 72
  },
  "funil": {
    "vendidos": 5,
    "agendados": 2,
    "em_negociacao": 15,
    "perdidos": 8
  },
  "top_objecoes": [
    { "nome": "Preço alto", "quantidade": 12 },
    { "nome": "Vou pensar", "quantidade": 8 }
  ],
  "destaque_positivo": "Maria (95/100)",
  "destaque_negativo": "João (45/100)",
  "mensagem_resumo": "🎉 Ontem sua equipe atendeu 45 pessoas..."
}
```

---

## Implementação

### Fase 1: Envio de Mensagens WhatsApp (⭐ Prioridade Alta)

**Adicionar função `sendWhatsAppMessage` em `uazapi.ts`:**

```typescript
export async function sendWhatsAppMessage(
  instanceToken: string,
  to: string, // número do destinatário
  message: string,
  imageUrl?: string, // opcional para gráfico
): Promise<boolean> {
  const response = await fetch(`${UAZAPI_BASE_URL}/message/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: instanceToken,
    },
    body: JSON.stringify({
      number: to,
      text: message,
    }),
  });
  return response.ok;
}
```

**Estimativa:** 2h

---

### Fase 2: Campo de Configuração (⭐ Prioridade Alta)

**Migration para adicionar número do gestor:**

```sql
ALTER TABLE public.config_empresas
ADD COLUMN IF NOT EXISTS whatsapp_gestor TEXT;

ALTER TABLE public.config_empresas
ADD COLUMN IF NOT EXISTS relatorio_semanal_ativo BOOLEAN DEFAULT false;

ALTER TABLE public.config_empresas
ADD COLUMN IF NOT EXISTS dia_relatorio TEXT DEFAULT 'segunda'; -- dia da semana

COMMENT ON COLUMN public.config_empresas.whatsapp_gestor IS
  'Número WhatsApp do gestor para receber relatórios (formato: 5511999999999)';
```

**Estimativa:** 1h

---

### Fase 3: Geração de Gráfico (⭐⭐ Prioridade Média)

**Opção A: QuickChart (mais simples)**

```typescript
// Gera URL de gráfico via QuickChart.io (grátis)
function generateChartUrl(funil: DailyReport["funil"]): string {
  const data = {
    type: "doughnut",
    data: {
      labels: ["Vendidos", "Agendados", "Negociação", "Perdidos"],
      datasets: [
        {
          data: [
            funil.vendidos,
            funil.agendados,
            funil.em_negociacao,
            funil.perdidos,
          ],
          backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"],
        },
      ],
    },
  };
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(data))}`;
}
```

**Opção B: ChartJS Node Canvas (mais controle)**

```bash
npm install chartjs-node-canvas chart.js
```

**Estimativa:** 2-4h

---

### Fase 4: API de Envio do Relatório (⭐ Prioridade Alta)

**Novo endpoint: `POST /api/send-weekly-report`**

```typescript
// src/app/api/send-weekly-report/route.ts
export async function POST(req: NextRequest) {
  // 1. Buscar empresas com relatório ativo
  // 2. Para cada empresa:
  //    a. Gerar relatório semanal (7 dias)
  //    b. Gerar gráfico
  //    c. Montar mensagem formatada
  //    d. Enviar via WhatsApp
  // 3. Retornar status
}
```

**Estimativa:** 4h

---

### Fase 5: Agendador (Cron Job) (⭐⭐ Prioridade Média)

**Opção A: Vercel Cron (recomendado se hospedado na Vercel)**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/send-weekly-report",
      "schedule": "0 9 * * 1" // Segunda-feira 9h
    }
  ]
}
```

**Opção B: GitHub Actions**

```yaml
# .github/workflows/weekly-report.yml
name: Weekly Report
on:
  schedule:
    - cron: "0 12 * * 1" # Segunda às 9h BRT (12h UTC)
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST ${{ secrets.API_URL }}/api/send-weekly-report
```

**Opção C: N8N (já usado no projeto)**

Criar workflow que dispara toda segunda às 9h e chama a API.

**Estimativa:** 1-2h

---

## Mensagem Modelo (WhatsApp)

```
📊 *Relatório Semanal - [Nome Empresa]*
📅 Período: 13/01 a 19/01/2026

━━━━━━━━━━━━━━━━━━━━━━

📈 *RESUMO*
• Atendimentos: 127
• Vendas: 89 | Suporte: 38
• Taxa de Conversão: 28%
• Nota Média: 74/100

━━━━━━━━━━━━━━━━━━━━━━

🎯 *FUNIL DE VENDAS*
✅ Vendidos: 18
📅 Agendados: 7
🔄 Em Negociação: 42
❌ Perdidos: 22

━━━━━━━━━━━━━━━━━━━━━━

⚠️ *TOP OBJEÇÕES*
1. Preço alto (34x)
2. Vou pensar (28x)
3. Não tenho tempo (15x)

━━━━━━━━━━━━━━━━━━━━━━

🏆 *DESTAQUE*
Melhor: Maria (95/100)
Precisa melhorar: João (45/100)

━━━━━━━━━━━━━━━━━━━━━━

💡 *INSIGHT DA SEMANA*
22 leads ficaram no vácuo.
Recupere-os com uma mensagem de
follow-up ainda hoje!

[Ver Dashboard Completo]
```

---

## Estimativa Total

| Fase      | Descrição                 | Tempo      |
| --------- | ------------------------- | ---------- |
| 1         | Função de envio WhatsApp  | 2h         |
| 2         | Campo de configuração     | 1h         |
| 3         | Geração de gráfico        | 2-4h       |
| 4         | API de envio do relatório | 4h         |
| 5         | Agendador (cron)          | 1-2h       |
| **Total** |                           | **10-13h** |

---

## Próximos Passos

- [ ] Validar prioridade com stakeholders
- [ ] Decidir opção de gráfico (QuickChart vs Canvas)
- [ ] Decidir opção de cron (Vercel/GitHub/N8N)
- [ ] Criar branch de feature
- [ ] Implementar em fases

---

## Referências

- [daily-report/route.ts](file:///c:/Users/jmaic/OneDrive/Documentos/Automações/Acutis/src/app/api/daily-report/route.ts) - API existente
- [uazapi.ts](file:///c:/Users/jmaic/OneDrive/Documentos/Automações/Acutis/src/lib/uazapi.ts) - Integração WhatsApp
- [UazAPI Docs](https://docs.uazapi.com/) - Documentação oficial
- [QuickChart.io](https://quickchart.io/) - Gerador de gráficos via URL
