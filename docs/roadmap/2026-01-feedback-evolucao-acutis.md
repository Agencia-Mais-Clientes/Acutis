# 📊 Análise Técnica do Feedback - Evolução Acutis

> **Data da Reunião:** Janeiro 2026  
> **Objetivo:** Avaliar viabilidade, custos, riscos e tempo para cada melhoria proposta  
> **Versão:** 1.0

---

## 📋 Sumário

1. [Posicionamento da Acutis](#-posicionamento-da-acutis)
2. [Estado Atual do Sistema](#-estado-atual-do-sistema)
3. [Análise Detalhada por Item](#-análise-detalhada-por-item)
4. [Tabela Resumo](#-tabela-resumo-geral)
5. [Roadmap de Implementação](#-roadmap-de-implementação)
6. [Riscos e Mitigações](#️-riscos-e-mitigações)
7. [Custos de API](#-estimativa-de-custos-api)
8. [Dúvidas para Alinhar](#-dúvidas-para-alinhar)
9. [Próximos Passos](#-próximos-passos)

---

## 🎯 Posicionamento da Acutis

> **A Acutis não é um CRM comum nem apenas um funil de vendas.**

Seu diferencial é **monitorar, interpretar e avaliar a qualidade real do atendimento no WhatsApp**, entregando:

- ✅ Diagnóstico automático
- ✅ Causa e consequência do sucesso ou fracasso
- ✅ Educação automática do vendedor

---

## 📋 Estado Atual do Sistema

Antes de planejar as melhorias, mapeei o que **já existe** no código:

### Estrutura de Arquivos Relevante

```
src/
├── lib/
│   ├── analyze-service.ts    # Orquestrador de análise IA (791 linhas)
│   ├── types.ts              # Schema do ResultadoIA
│   └── supabase.ts           # Cliente Supabase
├── app/
│   ├── api/
│   │   ├── analyze-conversations/  # Endpoint de análise batch
│   │   ├── daily-report/           # Relatório diário (existe!)
│   │   └── chat/                   # Assistente IA
│   └── dashboard/
│       ├── _components/
│       │   └── TabelaAuditoria.tsx # Tabela de análises
│       ├── actions.ts              # Server actions KPIs
│       └── page.tsx                # Dashboard principal
supabase/
└── migrations/                     # Migrations do banco
```

### Funcionalidades Atuais

| Componente                  | Status                 | Arquivo Principal           |
| --------------------------- | ---------------------- | --------------------------- |
| **Análise por IA (Gemini)** | ✅ Funcionando         | `analyze-service.ts`        |
| **Nota de Atendimento**     | ⚠️ Nota única 0-100    | `types.ts` linha 24         |
| **Funil de Fases**          | ✅ Completo            | 6 fases implementadas       |
| **Detecção de Objeções**    | ✅ Funcionando         | Array `objecoes_detectadas` |
| **Pontos Fortes/Fracos**    | ✅ Funcionando         | `performance_vendas`        |
| **Relatório Diário**        | ⚠️ Existe, não dispara | `/api/daily-report`         |
| **Horário Funcionamento**   | ❌ Não existe          | -                           |
| **Alertas Tempo Real**      | ❌ Não existe          | -                           |
| **Conversão Automática**    | ✅ Funcionando         | `funil_fase: "Vendido"`     |
| **Instruções Customizadas** | ✅ Backend pronto      | `config.instrucoes_ia`      |
| **Exportação Dados**        | ❌ Não existe          | -                           |

### Schema Atual do Resultado IA

```typescript
// src/lib/types.ts
interface ResultadoIA {
  tipo_conversacao: "Vendas" | "Suporte" | "Outros";
  temperatura: "Quente" | "Morno" | "Frio";
  funil_fase:
    | "Vendido"
    | "Agendado"
    | "Em Negociação"
    | "Perdido"
    | "Resolvido"
    | "Em Atendimento";
  nota_atendimento_0_100: number; // ⚠️ Nota única - será substituída por pilares
  resumo_executivo: string;
  proximo_passo_sugerido: string;
  conversao_realizada: boolean;
  detalhes_conversao: string | null;
  objecoes_detectadas: string[];
  dados_cadastrais: DadosCadastrais;
  performance_vendas: PerformanceVendas;
  metrics: Metrics;
  dados_agendamento?: { data_agendada; tipo_agendamento };
  dados_venda?: { plano; valor; forma_pagamento; tempo_contrato };
}
```

---

## 🎯 Análise Detalhada por Item

### 1️⃣ Pilares de Qualidade no Atendimento (DIFERENCIAL-CHAVE)

**📌 O que foi pedido:**  
Criar 3-4 pilares fixos de avaliação com nota individual:

1. Rapport / Conexão
2. Personalização do Atendimento
3. Condução de Fechamento
4. Tratamento de Objeções

**🎯 Diferencial:** A ferramenta educa o vendedor automaticamente, mostrando o erro e sugerindo melhoria.

#### Avaliação Técnica

| Aspecto              | Valor      |
| -------------------- | ---------- |
| **Viabilidade**      | ✅ Alta    |
| **Complexidade**     | 🟡 Média   |
| **Esforço Estimado** | 8-12 horas |
| **Risco**            | Baixo      |
| **Dependências**     | Nenhuma    |

#### Arquivos a Modificar

| Arquivo                                             | Alteração                                |
| --------------------------------------------------- | ---------------------------------------- |
| `src/lib/types.ts`                                  | Adicionar interface `PilaresAtendimento` |
| `src/lib/analyze-service.ts`                        | Alterar prompt (linhas 480-578)          |
| `src/app/dashboard/_components/TabelaAuditoria.tsx` | UI para exibir notas por pilar           |
| `src/app/dashboard/_components/DetalheLead.tsx`     | Detalhe expandido com pilares            |

#### Schema Proposto

```typescript
// Novo schema para pilares
interface PilarAtendimento {
  nota: number; // 0-100
  feedback: string; // Feedback específico
  sugestao: string; // O que fazer diferente
}

interface PilaresAtendimento {
  rapport_conexao: PilarAtendimento;
  personalizacao: PilarAtendimento;
  conducao_fechamento: PilarAtendimento;
  tratamento_objecoes: PilarAtendimento;
  nota_geral: number; // Média ponderada dos 4 pilares
}
```

#### Exemplo de Output IA

```json
{
  "pilares_atendimento": {
    "rapport_conexao": {
      "nota": 85,
      "feedback": "Criou boa conexão inicial, usou nome do cliente",
      "sugestao": "Poderia ter perguntado sobre a rotina antes de apresentar planos"
    },
    "personalizacao": {
      "nota": 60,
      "feedback": "Apresentou planos genéricos sem entender necessidade",
      "sugestao": "Perguntar objetivo (emagrecimento, hipertrofia, etc.) antes de oferecer"
    },
    "conducao_fechamento": {
      "nota": 40,
      "feedback": "Não apresentou CTA claro, deixou decisão aberta",
      "sugestao": "Usar técnica de assumir a venda: 'Vou te agendar para amanhã às 14h, pode ser?'"
    },
    "tratamento_objecoes": {
      "nota": 75,
      "feedback": "Respondeu bem à objeção de preço com comparação",
      "sugestao": "Poderia ter oferecido parcelamento imediatamente"
    },
    "nota_geral": 65
  }
}
```

#### Alteração no Prompt IA

```markdown
# PILARES DE AVALIAÇÃO (OBRIGATÓRIO)

Avalie CADA pilar separadamente com nota 0-100:

1. **RAPPORT/CONEXÃO** (Peso 20%):
   - Usou nome do cliente?
   - Criou conexão pessoal?
   - Tom amigável vs robótico?
2. **PERSONALIZAÇÃO** (Peso 30%):
   - Entendeu necessidade específica?
   - Ofereceu solução adequada ao perfil?
   - Fez perguntas de qualificação?
3. **CONDUÇÃO DE FECHAMENTO** (Peso 30%):
   - Apresentou CTA claro?
   - Usou técnicas de fechamento?
   - Criou urgência/escassez?
4. **TRATAMENTO DE OBJEÇÕES** (Peso 20%):
   - Respondeu objeções de forma eficaz?
   - Ofereceu alternativas?
   - Aceitou passivamente ou contornou?

Para CADA pilar, forneça:

- nota: 0-100
- feedback: O que observou (seja específico)
- sugestao: O que deveria ter feito diferente
```

#### Impacto no Custo

| Métrica                      | Antes   | Depois   |
| ---------------------------- | ------- | -------- |
| Tokens por análise           | ~800    | ~1200    |
| Custo por análise            | ~$0.001 | ~$0.0015 |
| Custo mensal (1000 análises) | ~$1.00  | ~$1.50   |

---

### 2️⃣ Análise Qualitativa da Conversa

**📌 O que foi pedido:**  
Menos foco em "avançou etapa X", mais análise de:

- Linguagem usada
- Gatilhos aplicados
- Falta de argumento
- Erros de condução
- Aceitação passiva de objeções

#### Avaliação Técnica

| Aspecto              | Valor                           |
| -------------------- | ------------------------------- |
| **Viabilidade**      | ✅ Alta                         |
| **Complexidade**     | 🟢 Baixa                        |
| **Esforço Estimado** | 4-6 horas                       |
| **Risco**            | Baixo                           |
| **Dependências**     | Pode ser feito junto com Item 1 |

#### Alteração no Prompt

Adicionar ao prompt existente:

```markdown
# ANÁLISE QUALITATIVA DETALHADA

Analise a QUALIDADE da comunicação, não apenas o resultado:

## Linguagem e Tom

- O atendente usou linguagem profissional? Informal demais? Fria?
- Houve erros de português que podem ter prejudicado?
- O tom foi adequado ao perfil do cliente?

## Técnicas de Vendas Aplicadas

- Quais gatilhos mentais foram usados? (escassez, prova social, autoridade, etc.)
- Quais técnicas de fechamento tentou?
- O que DEIXOU de fazer que poderia ter feito?

## Erros Críticos

- Aceitou objeção passivamente sem contornar?
- Deixou cliente sem resposta por muito tempo?
- Perdeu oportunidade clara de fechamento?
- Falou mais do que ouviu?

## Diagnóstico Final

- POR QUE a venda não aconteceu (se não aconteceu)?
- O que especificamente causou a perda?
- Em qual momento a venda "morreu"?
```

#### Novo Campo no Schema

```typescript
interface AnaliseQualitativa {
  linguagem: {
    avaliacao: "Excelente" | "Boa" | "Regular" | "Ruim";
    observacoes: string;
  };
  gatilhos_aplicados: string[]; // ["escassez", "prova_social"]
  gatilhos_faltantes: string[]; // ["urgência", "autoridade"]
  erros_criticos: string[]; // Lista de erros graves
  momento_perda?: string; // "Quando cliente perguntou preço e não teve resposta rápida"
  diagnostico_final: string; // Resumo do que causou sucesso ou fracasso
}
```

---

### 3️⃣ Filtro Inteligente de Horário de Atendimento

**📌 O que foi pedido:**  
Não penalizar tempo de resposta quando lead chama fora do expediente (ex: domingo).

#### Avaliação Técnica

| Aspecto              | Valor              |
| -------------------- | ------------------ |
| **Viabilidade**      | ✅ Alta            |
| **Complexidade**     | 🟡 Média           |
| **Esforço Estimado** | 6-10 horas         |
| **Risco**            | Médio              |
| **Dependências**     | Migration de banco |

#### Alteração no Banco de Dados

```sql
-- Migration: add_horario_funcionamento.sql
ALTER TABLE config_empresas
ADD COLUMN horario_funcionamento JSONB DEFAULT '{
  "segunda": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "terca": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "quarta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "quinta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "sexta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
  "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": true},
  "domingo": {"inicio": null, "fim": null, "ativo": false}
}'::jsonb;

ALTER TABLE config_empresas
ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';
```

#### Lógica de Cálculo

```typescript
// src/lib/analyze-service.ts - Nova função

function calcularTempoRespostaJusto(
  mensagemCliente: Date,
  respostaAtendente: Date,
  horarioFuncionamento: HorarioFuncionamento,
  timezone: string
): { tempoReal: number; tempoJusto: number; foraExpediente: boolean } {
  // 1. Verificar se mensagem foi fora do expediente
  const diaSemana = getDayOfWeek(mensagemCliente, timezone);
  const horaDia = getHour(mensagemCliente, timezone);
  const configDia = horarioFuncionamento[diaSemana];

  // 2. Se foi fora do expediente, calcular tempo a partir da abertura
  if (
    !configDia.ativo ||
    horaDia < configDia.inicio ||
    horaDia > configDia.fim
  ) {
    const proximaAbertura = getProximaAbertura(
      mensagemCliente,
      horarioFuncionamento,
      timezone
    );
    const tempoJusto = respostaAtendente.getTime() - proximaAbertura.getTime();
    return {
      tempoReal: respostaAtendente.getTime() - mensagemCliente.getTime(),
      tempoJusto: Math.max(0, tempoJusto),
      foraExpediente: true,
    };
  }

  // 3. Se foi dentro do expediente, tempo normal
  return {
    tempoReal: respostaAtendente.getTime() - mensagemCliente.getTime(),
    tempoJusto: respostaAtendente.getTime() - mensagemCliente.getTime(),
    foraExpediente: false,
  };
}
```

#### UI Necessária

- Página de configuração da empresa com editor de horários
- Checkbox para cada dia da semana
- Inputs de hora início/fim
- Preview visual do horário

---

### 4️⃣ Identificação Automática de Conversão

**📌 O que foi pedido:**  
A ferramenta entende sozinha quando a venda aconteceu.

#### Avaliação Técnica

| Aspecto     | Valor                      |
| ----------- | -------------------------- |
| **Status**  | ✅ **JÁ IMPLEMENTADO**     |
| **Esforço** | 0 horas (apenas validação) |

#### O que já existe

```typescript
// src/lib/types.ts - Já implementado
interface ResultadoIA {
  funil_fase: "Vendido" | "Agendado" | ...;  // Detecta automático
  conversao_realizada: boolean;              // Flag de conversão
  detalhes_conversao: string | null;         // Descrição
  dados_venda?: {                            // Detalhes extraídos
    plano: string | null;
    valor: number | null;
    forma_pagamento: string | null;
    tempo_contrato: string | null;
  };
}
```

#### Prompt atual (linhas 538-545)

```markdown
7. **EXTRAÇÃO DE DADOS DE CONVERSÃO (IMPORTANTE):**
   - Se funil_fase = "Agendado": extraia a DATA/HORA do agendamento
   - Se funil_fase = "Vendido": extraia TODOS os detalhes da venda:
     - **plano**: Qual plano fechou
     - **valor**: Valor em R$ mencionado
     - **forma_pagamento**: Cartão, PIX, boleto, etc.
     - **tempo_contrato**: Período do plano
```

**✅ Ação:** Apenas validar a precisão com casos reais e ajustar prompt se necessário.

---

### 5️⃣ Campos de Análise Personalizada pelo Gestor

**📌 O que foi pedido:**  
O gestor pode pedir análises específicas:

- "Analise só leads de produto X"
- "Quero foco em vendas de maior ticket"
- "Observe este tipo específico de cliente"

#### Avaliação Técnica

| Aspecto              | Valor                        |
| -------------------- | ---------------------------- |
| **Viabilidade**      | ✅ Alta                      |
| **Complexidade**     | 🟡 Média                     |
| **Esforço Estimado** | 8-12 horas                   |
| **Risco**            | Baixo                        |
| **Dependências**     | Nenhuma (backend já existe!) |

#### O que já existe (backend pronto!)

```typescript
// src/lib/analyze-service.ts - Linha 476-478
const instrucoesCustomizadas = config.instrucoes_ia
  ? `\n# INSTRUÇÕES ESPECÍFICAS DA EMPRESA\n${config.instrucoes_ia}\n`
  : "";
```

#### O que falta: UI de Configuração

Criar página `/admin/empresas/[id]/instrucoes` com:

```typescript
// Exemplo de instruções que o gestor pode configurar
const exemploInstrucoes = `
# Foco de Análise
- Priorize análise de leads interessados em plano ANUAL
- Clientes que mencionam "academia perto de casa" são prioritários
- Ignore leads que só perguntam preço e somem

# Critérios Específicos
- Se lead mencionar que já treinou antes, considere cliente QUENTE
- Objeção "não tenho tempo" é crítica - sempre sinalizar
- Vendedor deve SEMPRE oferecer aula experimental

# O que avaliar com rigor
- Tempo de resposta deve ser menor que 5 minutos
- Vendedor DEVE perguntar objetivo do treino
- Vendedor DEVE apresentar pelo menos 2 opções de plano
`;
```

#### UI Necessária

1. **Textarea** para instruções livres
2. **Templates** pré-definidos (academia, clínica, etc.)
3. **Preview** de como as instruções serão usadas
4. **Histórico** de alterações

---

### 7️⃣ Alertas Críticos em Tempo Real

**📌 O que foi pedido:**  
Quando algo grave acontece, a Acutis interrompe o silêncio:

- Cliente muitas horas sem resposta
- Atendimento agressivo ou inadequado
- Risco claro de perda de venda

#### Avaliação Técnica

| Aspecto              | Valor                        |
| -------------------- | ---------------------------- |
| **Viabilidade**      | 🟡 Média-Alta                |
| **Complexidade**     | 🔴 Alta                      |
| **Esforço Estimado** | 16-24 horas                  |
| **Risco**            | Médio                        |
| **Dependências**     | Integração WhatsApp (UazAPI) |

#### Arquitetura Proposta

```
┌──────────────────┐
│ mensagens_clientes│
│    (Supabase)    │
└────────┬─────────┘
         │ Trigger/Cron
         ▼
┌──────────────────┐
│ Alert Service    │
│ (Edge Function)  │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│Simples│  │Com IA │
│(tempo)│  │(risco)│
└───┬───┘  └───┬───┘
    │          │
    └────┬─────┘
         ▼
┌──────────────────┐
│   UazAPI         │
│ (Envio WhatsApp) │
└──────────────────┘
```

#### Tipos de Alertas

| Tipo                   | Detecção            | Usa IA? | Custo |
| ---------------------- | ------------------- | ------- | ----- |
| Sem resposta > X horas | Query simples       | ❌      | Baixo |
| Lead quente esfriando  | Temperatura + tempo | ❌      | Baixo |
| Objeção não tratada    | Mini-análise        | ✅      | Médio |
| Atendimento agressivo  | Análise de tom      | ✅      | Alto  |

#### Configuração por Empresa

```typescript
interface ConfigAlertas {
  ativo: boolean;
  whatsapp_gestor: string; // Número para enviar alertas

  // Alertas simples (sem IA)
  tempo_sem_resposta_minutos: number; // Ex: 30
  leads_quentes_prioridade: boolean;

  // Alertas com IA (custo extra)
  detectar_risco_perda: boolean;
  detectar_atendimento_ruim: boolean;
  nota_minima_alerta: number; // Ex: 40

  // Horários de envio
  enviar_durante_expediente_apenas: boolean;
  consolidar_alertas: boolean; // Enviar resumo ao invés de cada um
}
```

#### Formato de Alerta WhatsApp

```
⚠️ *ALERTA ACUTIS*

🔴 *Lead sem resposta há 2h*
Cliente: João Silva
WhatsApp: 11999887766
Última msg: "Qual o valor do plano mensal?"

⏰ Enviado: 12:30
🕐 Agora: 14:30

_Responda agora para não perder essa venda!_
```

---

### 8️⃣ Relatórios Proativos via WhatsApp

**📌 O que foi pedido:**  
Relatório semanal/diário enviado automaticamente no WhatsApp do gestor.

#### Avaliação Técnica

| Aspecto              | Valor             |
| -------------------- | ----------------- |
| **Viabilidade**      | ✅ Alta           |
| **Complexidade**     | 🟢 Baixa-Média    |
| **Esforço Estimado** | 8-12 horas        |
| **Risco**            | Baixo             |
| **Dependências**     | Cron job + UazAPI |

#### O que já existe

```typescript
// src/app/api/daily-report/route.ts - Já gera relatório!
interface DailyReport {
  empresa: string;
  periodo: string;
  metricas: {
    total_atendimentos: number;
    vendas: number;
    suporte: number;
    taxa_conversao: number;
    nota_media: number;
  };
  funil: { vendidos; agendados; em_negociacao; perdidos };
  top_objecoes: { nome; quantidade }[];
  destaque_positivo: string | null;
  destaque_negativo: string | null;
  mensagem_resumo: string;
}
```

#### O que falta

1. **Cron Job** para disparar automaticamente
2. **Integração UazAPI** para enviar WhatsApp
3. **Formatação** para WhatsApp (emojis, markdown)
4. **Configuração** de frequência por empresa

#### Formato de Mensagem WhatsApp

```
📊 *Relatório Semanal - Academia Fit*
📅 06 a 12 de Janeiro

━━━━━━━━━━━━━━━━━━━━━
📈 *RESULTADOS*
━━━━━━━━━━━━━━━━━━━━━
✅ Vendas: 15 (32% conversão)
📅 Agendamentos: 8
⏳ Em Negociação: 23
❌ Perdidos: 12

━━━━━━━━━━━━━━━━━━━━━
🎯 *TOP OBJEÇÕES*
━━━━━━━━━━━━━━━━━━━━━
1️⃣ Preço (40%)
2️⃣ Horário (25%)
3️⃣ Localização (15%)

━━━━━━━━━━━━━━━━━━━━━
⭐ *DESTAQUES*
━━━━━━━━━━━━━━━━━━━━━
🏆 Melhor: João (nota 92)
⚠️ Atenção: Maria (nota 48)

━━━━━━━━━━━━━━━━━━━━━
📱 Ver detalhes: acutis.app/dash
```

#### Configuração por Empresa

```sql
ALTER TABLE config_empresas ADD COLUMN config_relatorio JSONB DEFAULT '{
  "ativo": true,
  "frequencia": "semanal",
  "dia_semana": "segunda",
  "hora": "08:00",
  "whatsapp_destino": null,
  "incluir_link_dashboard": true
}'::jsonb;
```

---

### 9️⃣ Veracidade dos Dados (Exportar e Consultar)

**📌 O que foi pedido:**

- Gerar TXT da conversa real
- Exportar listas para remarketing
- Conferir análise na íntegra

#### Avaliação Técnica

| Aspecto              | Valor      |
| -------------------- | ---------- |
| **Viabilidade**      | ✅ Alta    |
| **Complexidade**     | 🟢 Baixa   |
| **Esforço Estimado** | 6-10 horas |
| **Risco**            | Baixo      |
| **Dependências**     | Nenhuma    |

#### Funcionalidades a Implementar

| Funcionalidade          | Esforço | Descrição                      |
| ----------------------- | ------- | ------------------------------ |
| Exportar Conversa (TXT) | 2h      | Botão na tabela de análises    |
| Exportar Lista CSV      | 3h      | Filtros por status, data, etc. |
| Ver Conversa Original   | 2h      | Link no detalhe do lead        |
| Comparar IA vs Real     | 3h      | Side-by-side no detalhe        |

#### Formato de Exportação TXT

```
===========================================
CONVERSA - Academia Fit
Lead: João Silva (11999887766)
Data: 10/01/2026 14:30 - 10/01/2026 15:45
Status: Agendado
===========================================

[14:30] Cliente: Oi, vi o anúncio de vocês no Instagram
[14:32] Atendente: Olá João! Tudo bem? 😊
[14:32] Atendente: Que bom que viu nosso anúncio!
[14:33] Cliente: Tudo sim. Quanto custa o plano mensal?
[14:35] Atendente: O mensal fica R$149, mas temos promoção...
...

===========================================
ANÁLISE IA
===========================================
Tipo: Vendas
Status: Agendado
Nota Geral: 78/100

Pilares:
- Rapport: 85 ✓
- Personalização: 70 ⚠
- Fechamento: 75 ✓
- Objeções: 80 ✓

Objeções detectadas: Preço
Próximo passo: Confirmar presença na aula experimental
```

#### Formato CSV para Remarketing

```csv
chatid,nome,whatsapp,status,nota,data_entrada,ultima_mensagem,objecoes,origem
5511999887766,João Silva,11999887766,Agendado,78,2026-01-10,2026-01-10,Preço,Meta
5511988776655,Maria Santos,11988776655,Perdido,45,2026-01-08,2026-01-09,Horário,Orgânico
```

---

### 🔟 Itens já discutidos com Maicon

**📌 O que foi pedido:**

- Painel de Vendas parecido com Vertical Digital (Timeline e funil)
- Separar Suporte e Vendas nos relatórios
- Filtro por data (na ausência, mostrar mês vigente)
- KPIs para agência (sidebar)

#### Avaliação Técnica

| Aspecto              | Valor       |
| -------------------- | ----------- |
| **Viabilidade**      | ✅ Alta     |
| **Complexidade**     | 🟡 Média    |
| **Esforço Estimado** | 20-30 horas |
| **Risco**            | Baixo       |

#### Detalhamento por Sub-item

| Sub-item                    | Esforço | Descrição                               |
| --------------------------- | ------- | --------------------------------------- |
| Timeline visual de vendas   | 8h      | Componente com linha do tempo por lead  |
| Funil visual Kanban         | 8h      | Drag-and-drop por fase                  |
| Separar Suporte/Vendas      | 4h      | Tabs ou filtro no dashboard             |
| Filtro por data             | 4h      | Date range picker                       |
| KPIs para Agência (sidebar) | 6h      | Painel lateral com métricas de campanha |

#### Mockup Funil Kanban

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  NOVO (23)  │ NEGOCIAÇÃO  │ AGENDADO(8) │ VENDIDO(15) │
│             │    (45)     │             │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │João     │ │ │Maria    │ │ │Pedro    │ │ │Ana      │ │
│ │🔴 Frio  │ │ │🟡 Morno │ │ │🟢 Quente│ │ │✅ R$149 │ │
│ │2h atrás │ │ │1d atrás │ │ │Amanhã   │ │ │Mensal   │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │Carlos   │ │ │Fernanda │ │ │Lucas    │ │ │...      │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 📈 Tabela Resumo Geral

| #   | Melhoria              | Viabilidade   | Esforço | Complexidade | Risco | Prioridade |
| --- | --------------------- | ------------- | ------- | ------------ | ----- | ---------- |
| 1   | Pilares de Qualidade  | ✅ Alta       | 8-12h   | 🟡 Média     | Baixo | 🥇 Alta    |
| 2   | Análise Qualitativa   | ✅ Alta       | 4-6h    | 🟢 Baixa     | Baixo | 🥇 Alta    |
| 3   | Filtro Horário        | ✅ Alta       | 6-10h   | 🟡 Média     | Médio | 🥈 Média   |
| 4   | Conversão Automática  | ✅ **Existe** | 0h      | N/A          | N/A   | ✅ Feito   |
| 5   | Análise Personalizada | ✅ Alta       | 8-12h   | 🟡 Média     | Baixo | 🥇 Alta    |
| 7   | Alertas Tempo Real    | 🟡 Média      | 16-24h  | 🔴 Alta      | Médio | 🥉 Baixa   |
| 8   | Relatório WhatsApp    | ✅ Alta       | 8-12h   | 🟢 Baixa     | Baixo | 🥇 Alta    |
| 9   | Exportação/Veracidade | ✅ Alta       | 6-10h   | 🟢 Baixa     | Baixo | 🥇 Alta    |
| 10  | Painel Vendas/KPIs    | ✅ Alta       | 20-30h  | 🟡 Média     | Baixo | 🥈 Média   |

**Esforço Total Estimado:** 76-116 horas (10-15 dias úteis de desenvolvimento)

---

## 🚀 Roadmap de Implementação

### Fase 1: Quick Wins + Diferencial (40-50h)

> **Prazo:** 1-2 semanas  
> **Foco:** Entregar valor rápido + diferencial competitivo

- [ ] **1.1** Pilares de Qualidade (Items 1+2) - 12h
  - [ ] Alterar schema `types.ts`
  - [ ] Modificar prompt `analyze-service.ts`
  - [ ] Atualizar UI `TabelaAuditoria.tsx`
  - [ ] Criar componente `PilaresCard.tsx`
- [ ] **1.2** Exportação/Veracidade (Item 9) - 8h
  - [ ] Botão exportar TXT
  - [ ] Exportar lista CSV
  - [ ] Link para conversa original
- [ ] **1.3** UI Instruções Customizadas (Item 5) - 8h
  - [ ] Página de edição de instruções
  - [ ] Templates pré-definidos
  - [ ] Preview do prompt
- [ ] **1.4** Relatório Semanal WhatsApp (Item 8) - 10h
  - [ ] Cron job (Vercel Cron)
  - [ ] Formatação WhatsApp
  - [ ] Integração UazAPI
  - [ ] Config por empresa
- [ ] **1.5** Filtro por Data (parte do Item 10) - 4h
  - [ ] Date range picker
  - [ ] Aplicar em todas as queries

### Fase 2: UI Premium (25-35h)

> **Prazo:** 1 semana  
> **Foco:** Experiência visual de alto nível

- [ ] **2.1** Painel Vendas Timeline - 8h
- [ ] **2.2** Funil Visual Kanban - 8h
- [ ] **2.3** Separar Suporte/Vendas - 4h
- [ ] **2.4** KPIs Agência (Sidebar) - 6h

### Fase 3: Avançado (25-35h)

> **Prazo:** 1-2 semanas  
> **Foco:** Funcionalidades avançadas

- [ ] **3.1** Filtro Horário Funcionamento (Item 3) - 10h
  - [ ] Migration banco
  - [ ] Lógica de cálculo justo
  - [ ] UI configuração horários
- [ ] **3.2** Alertas Tempo Real (Item 7) - 20h
  - [ ] Edge Function monitor
  - [ ] Regras de alerta
  - [ ] Integração WhatsApp
  - [ ] Config por empresa

---

## ⚠️ Riscos e Mitigações

| Risco                          | Probabilidade | Impacto | Mitigação                            |
| ------------------------------ | ------------- | ------- | ------------------------------------ |
| Custo API aumentar com pilares | Média         | Baixo   | Monitorar consumo, cache de análises |
| Alertas gerarem spam           | Alta          | Médio   | Consolidar alertas, limites por hora |
| Horário funcionamento complexo | Média         | Baixo   | Começar simples (horário fixo)       |
| Gestor não usar dashboard      | Alta          | Alto    | Relatório WhatsApp resolve isso      |
| Rate limit Gemini              | Baixa         | Médio   | Retry com backoff (já implementado)  |
| UazAPI instável                | Média         | Médio   | Fallback para email, retry           |

---

## 💰 Estimativa de Custos API

### Custo Atual (Gemini Flash)

| Métrica                    | Valor                   |
| -------------------------- | ----------------------- |
| Custo por 1M tokens input  | $0.10                   |
| Custo por 1M tokens output | $0.40                   |
| Tokens médios por análise  | ~1500 (in) + ~500 (out) |
| **Custo por análise**      | ~$0.00035               |

### Projeção com Melhorias

| Cenário                   | Análises/mês | Custo Mensal |
| ------------------------- | ------------ | ------------ |
| Atual                     | 1000         | ~$0.35       |
| Com pilares (+50% tokens) | 1000         | ~$0.52       |
| Com alertas IA (+500/mês) | 1500         | ~$0.78       |
| Escala 5 empresas         | 5000         | ~$2.60       |
| Escala 20 empresas        | 20000        | ~$10.40      |

> **Conclusão:** Custo de API é irrelevante para o modelo de negócio. Mesmo com 20 empresas ativas, o custo mensal seria ~R$60.

---

## ❓ Dúvidas para Alinhar

### Sobre Pilares de Qualidade

1. Os 4 pilares sugeridos (Rapport, Personalização, Condução, Objeções) estão OK?
2. Devemos calcular uma nota geral (média) ou mostrar só os pilares individuais?
3. Peso igual para todos os pilares ou algum mais importante?

### Sobre Relatório WhatsApp

4. Qual frequência padrão? Semanal, diário, ou configurável por empresa?
5. Qual dia/hora ideal para envio? (ex: segunda às 8h)
6. Incluir link para o dashboard no relatório?

### Sobre Alertas

7. Qual tempo de "sem resposta" é crítico? 30min? 1h? 2h?
8. Isso deve variar por empresa ou ser fixo?
9. Alertas consolidados (resumo diário) ou em tempo real?

### Sobre Horário de Funcionamento

10. Cada empresa terá um horário diferente?
11. Considerar feriados? (complexidade extra)

### Sobre Prioridades

12. Concorda com a ordem do roadmap sugerido?
13. Tem algum item que é mais urgente para demonstrar para clientes?

---

## ✅ Próximos Passos

1. **Revisar este documento** e responder as dúvidas
2. **Validar prioridades** do roadmap
3. **Começar Fase 1** após alinhamento
4. **Acompanhar progresso** via reuniões semanais

---

> **Documento criado em:** 13/01/2026  
> **Autor:** Assistente de Desenvolvimento  
> **Versão:** 1.0
