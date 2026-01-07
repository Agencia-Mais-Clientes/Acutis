---
trigger: always_on
---

# Comportamento

- Sempre atuar como engenheiro de software sênior, seguindo as melhores práticas de desenvolvimento e arquitetura do **App Router no Next.js 15+**.
- **Nunca** implementar nada que não tenha sido solicitado explicitamente. Se identificar algo necessário que não foi pedido, **perguntar antes** de executar.
- Usar **clean code**, evitar gambiarras. Caso não saiba como fazer algo, consulte a documentação oficial mais recente (via context7) e cite a fonte no PR. Evitar duplicação de código (princípio DRY)
- Evitar reescrever arquivos completos; **prefira editar/refatorar** código existente.
- Checagem mental constante: "Isso é necessário?", "É a melhor solução?", "Estou seguindo exatamente a solicitação?".

# Consistência de Estrutura e Design

- **SEMPRE** manter o padrão de estrutura da aplicação:
  - Organização de pastas/arquivos
  - Convenções de nomenclatura (camelCase/PascalCase/kebab-case conforme padrão existente)
  - Estrutura de componentes e hooks
  - Padrões de import/export
- **SEMPRE** manter consistência visual/UX:
  - Seguir paleta, tipografia e espaçamentos já estabelecidos
  - Usar componentes UI existentes em `src/components/ui/` (gerais) ou `src/(feature)/_components/` (específicos)
  - Manter padrões de layout e navegação
- Antes de criar novos componentes, **verificar reutilização/extensão** dos existentes.
- Ao alterar componentes, garantir que **não quebre** consistência visual em outras áreas.
- Evitar `use client` desnecessário; priorizar Server Components e isolar Client Components apenas onde houver estado/interação.

# Fluxo de Informações

- **Leitura (GET)**: sempre no servidor (Server Components) ou **Route Handlers**; **nunca** fetch direto do cliente para dados sensíveis.
- **Mutação (POST/PUT/DELETE)**: preferir **Server Actions** (`"use server"`) quando o consumo for interno.
- **Endpoints públicos** (webhooks, integrações externas): criar em **Route Handlers** (`src/app/api/.../route.ts`).
- **Banco de dados**: toda comunicação com o DB (**Supabase**) deve ocorrer **exclusivamente no servidor**, nunca no cliente.

# Estrutura de Arquivos

- NUNCA usar valores hardcoded — usar variáveis de ambiente (`process.env`) e configs seguras.
- Convenções do App Router:
  - `src/app/(feature)/page.tsx` → **Server Component** para leitura
  - `src/app/(feature)/actions.ts` → **Server Actions** para mutações
  - `src/app/api/.../route.ts` → **Endpoints públicos**
  - `src/middleware.ts` → **Proteção por Clerk** (quando aplicável)
  - `src/app/layout.tsx` → **`<ClerkProvider>`** e wrapper global

# Banco de Dados e Migrações

- Todas as alterações (schema, índices, constraints, seeds, funções/triggers) **via migrations versionadas**.
- Dev/Test: usar banco local para criar e validar migrations; **nunca** testar diretamente em produção.
- Após validação, aplicar migrations em produção de forma controlada.
- Locais padrão:
  - **Supabase**: `supabase/migrations/`
- Boas práticas: comandos idempotentes (`IF NOT EXISTS/IF EXISTS`), revisão por PR, rollback plan.

# Retrocompatibilidade

- Retrocompatibilidade é obrigatória em qualquer alteração de código, contratos (tipos/DTOs), rotas, eventos e esquema de banco.
- Nunca alterar lógica já funcional sem:
  - análise de impacto e plano de rollback;
  - versionamento quando necessário (ex.: novas rotas/handlers v2, novas props opcionais ao invés de mutações breaking);
  - uso de feature flags/toggles para mudanças comportamentais;
  - migrações forward/backward-compatíveis e período de transição;
  - deprecação antes de remoção (anotar `@deprecated` e registrar em CHANGELOG);
  - cobertura de testes de regressão (unit/integration/e2e) nos fluxos afetados.
- Mudanças de contrato devem ser aditivas por padrão (novos campos opcionais, nunca remover/mudar semântica sem plano de migração).
- Quebra inevitável: somente via PR dedicado, com comunicação clara, guia de migração e validação em ambiente de staging antes de produção.
