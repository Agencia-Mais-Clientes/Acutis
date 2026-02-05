# Relatório de Auditoria do Projeto Acutis

Este relatório apresenta uma análise técnica profunda do estado atual do projeto, cobrindo Segurança, Arquitetura, Qualidade de Código e UX.

## 🚨 1. Segurança (Crítico)

### 🔴 Vulnerabilidade IDOR (Insecure Direct Object Reference)

**O que é:** O sistema confia cegamente no `ownerId` enviado pelo cliente.
**Onde:**

- `src/lib/supabase.ts`: O `supabaseAdmin` é inicializado com a `SUPABASE_SERVICE_ROLE_KEY`. Essa chave **ignora todas as regras de segurança (RLS)** do banco de dados.
- `src/app/api/chat/route.ts`: Recebe `ownerId` no corpo da requisição e usa `supabaseAdmin` para buscar dados.
- `src/app/dashboard/actions.ts`: Server Actions recebem `ownerId` como argumento público.

**Risco:** Um ator mal-intencionado pode alterar o `ownerId` na requisição (interceptando o tráfego ou via console) e acessar dados de **qualquer outra empresa** cadastrada no sistema.

**Recomendação Imediata:**

1. **Nunca** confie no `ownerId` vindo do frontend.
2. Use `createServerComponentClient` (do pacote `@supabase/auth-helpers-nextjs` ou `@supabase/ssr`) para obter o usuário autenticado da sessão.
3. Derive o `ownerId` da sessão do usuário no servidor, ou valide se o usuário da sessão tem permissão de leitura sobre o `ownerId` solicitado.
4. Prefira usar um cliente Supabase com token de usuário (RLS ativo) ao invés do `supabaseAdmin` para leituras de dados sensíveis.

---

## 🏗️ 2. Arquitetura e Código

### ⚠️ Duplicação de Lógica

- **Parsing de Datas:** A lógica de regex `/(\d{2})\/(\d{2})\/(\d{4})/` e criação de objetos `Date` está repetida em `actions.ts` e `actions-dashboard.ts`.
- **Typo Risks:** Strings mágicas como `"negociação"`, `"negociacao"`, `"vendido"`, `"matriculado"` estão espalhadas pelo código. Se uma regra de negócio mudar (ex: nova fase "pré-venda"), você terá que caçar em vários arquivos.

**Recomendação:**

- Centralizar utilitários de data em `src/lib/date-utils.ts`.
- Criar constantes ou Enums para as fases do funil em `src/lib/constants.ts`.

### ⚠️ Performance

- **Server Actions vs API Routes:** O projeto mistura Server Actions (`actions.ts`) e API Routes (`/api/chat`). Isso não é necessariamente ruim, mas Server Actions são preferíveis para mutações e API Routes para integrações externas.
- **Cache:** Não vi estratégias claras de cache (ex: `revalidatePath` ou `unstable_cache`) nas queries pesadas de dashboard. Isso pode causar lentidão conforme o volume de dados cresce.

---

## 🎨 3. UI/UX

### ✅ Pontos Positivos

- Uso de `useTransition` no Dashboard para evitar travamento da UI durante filtros.
- Interface limpa usando Tailwind e componentes Radix UI.
- Filtro de datas agora consistente (trabalho recente).

### ⚠️ Pontos de Atenção

- **Loading States:** Algumas interações podem não ter feedback visual imediato fora do Dashboard principal.
- **Mobile:** Verificar se a tabela de auditoria e gráficos complexos são responsivos em telas pequenas.

---

## 🚀 4. Sugestões de Implementação (Roadmap)

### Curto Prazo (Must Have)

1. **Correção de Segurança:** Implementar validação de sessão em todas as Server Actions e API Routes.
2. **Refatoração:** Centralizar lógica de datas e constantes.

### Médio Prazo (Nice to Have)

1. **Testes Automatizados:** Adicionar testes E2E (Playwright) para fluxos críticos (Login -> Dashboard -> Filtro).
2. **Dashboard Performance:** Implementar paginação nas tabelas (atualmente busca tudo e filtra no array em memória em alguns casos, ou busca 50 itens fixos na API de chat).
3. **Internacionalização (i18n):** Preparar o código para múltiplos idiomas se houver planos de expansão.

---

### Resumo para Ação

A prioridade zero deve ser fechar a brecha de segurança no acesso aos dados. O resto são melhorias de qualidade e manutenibilidade.
