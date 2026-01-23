# 🎯 Campos de Análise Personalizada pelo Gestor

> **Status:** Viável ✅  
> **Criado em:** 23/01/2026  
> **Última atualização:** 23/01/2026

## Visão Geral

Permitir que o gestor solicite análises específicas, como:

- "Analise só leads de produto X"
- "Quero foco em vendas de maior ticket"
- "Observe este tipo específico de cliente"

👉 A IA ajusta o relatório conforme o objetivo do negócio.

---

## Status Atual

### Já Existe no Sistema

| Campo                   | Tabela            | Descrição                                           |
| ----------------------- | ----------------- | --------------------------------------------------- |
| `instrucoes_ia`         | `config_empresas` | Instruções personalizadas injetadas no prompt da IA |
| `analise_origem_filter` | `config_empresas` | Filtro por origem (trafego_pago, organico, todos)   |
| `nicho`                 | `config_empresas` | Nicho da empresa (contexto para análise)            |
| `objetivo_conversao`    | `config_empresas` | Objetivo de conversão (Vendas, Agendamento, etc.)   |

### Como Funciona Hoje

O campo `instrucoes_ia` já é injetado no prompt da IA:

```typescript
// analyze-service.ts
const instrucoesCustomizadas = config.instrucoes_ia
  ? `\n# INSTRUÇÕES ESPECÍFICAS DA EMPRESA\n${config.instrucoes_ia}\n`
  : "";
```

---

## Abordagens de Implementação

### Abordagem A: Instruções em Texto Livre (⭐ Simples)

**Já funciona hoje!** O gestor escreve no campo `instrucoes_ia`.

**Exemplos de instruções:**

- "Foque apenas em leads que mencionam o plano Premium"
- "Dê atenção especial a leads com ticket acima de R$500"
- "Observe padrões de leads que não respondem após 24h"
- "Analise apenas leads que vieram de anúncio de produto X"

**O que falta:**

- [ ] Interface no dashboard para editar `instrucoes_ia`
- [ ] Documentação/exemplos para o gestor
- [ ] Validação de tamanho máximo do campo

**Estimativa:** 2-4h

---

### Abordagem B: Filtros Estruturados (⭐⭐ Médio)

Criar campos específicos que filtram leads ANTES de analisar.

**Novos campos a criar:**

```sql
ALTER TABLE public.config_empresas ADD COLUMN IF NOT EXISTS filtros_analise JSONB DEFAULT '{}';
```

**Estrutura do JSONB:**

```json
{
  "produtos": ["Plano Premium", "Plano Basic"],
  "ticket_minimo": 500,
  "ticket_maximo": null,
  "tipo_cliente": ["novo", "retorno"],
  "tags_incluir": ["vip", "hot"],
  "tags_excluir": ["spam", "teste"],
  "periodo_dias": 30
}
```

**O que falta:**

- [ ] Migration para novo campo
- [ ] Interface de configuração de filtros
- [ ] Lógica de filtragem no `analyze-service.ts`
- [ ] Sincronização com tabela `lead_tracking` ou nova tabela de metadados

**Estimativa:** 8-16h

---

### Abordagem C: Análises Sob Demanda (⭐⭐⭐ Avançado)

Interface onde o gestor solicita análises ad-hoc com prompts personalizados.

**Funcionalidades:**

1. Botão "Nova Análise Personalizada" no dashboard
2. Modal com:
   - Campo de texto para prompt personalizado
   - Seletor de período
   - Filtros de leads (origem, vendedor, produto)
3. Fila de processamento assíncrono
4. Histórico de análises personalizadas

**Novos artefatos:**

- [ ] Tabela `analises_personalizadas`
- [ ] API POST `/api/analyze/custom`
- [ ] Componente `ModalAnalisePersonalizada`
- [ ] Página de histórico de análises

**Estimativa:** 24-40h

---

## Recomendação

### Fase 1: Quick Win (Abordagem A)

1. Criar interface para editar `instrucoes_ia` existente
2. Adicionar exemplos/templates prontos
3. Tempo: 2-4h

### Fase 2: Filtros Básicos (Abordagem B parcial)

1. Adicionar campo `filtros_analise` JSONB
2. Implementar filtro por produto/ticket
3. Tempo: 8-12h

### Fase 3: Análises Sob Demanda (Abordagem C)

1. Implementar sistema completo de análises personalizadas
2. Tempo: 24-40h

---

## Próximos Passos

- [ ] Validar prioridade com stakeholders
- [ ] Definir qual abordagem implementar primeiro
- [ ] Criar branch de feature
- [ ] Implementar e testar

---

## Referências

- [analyze-service.ts](file:///c:/Users/jmaic/OneDrive/Documentos/Automações/Acutis/src/lib/analyze-service.ts)
- [analyze-types.ts](file:///c:/Users/jmaic/OneDrive/Documentos/Automações/Acutis/src/lib/analyze-types.ts)
- [config_empresas migration](file:///c:/Users/jmaic/OneDrive/Documentos/Automações/Acutis/supabase/migrations/20260108000001_create_config_empresas.sql)
