# Roadmap de Evolução Técnica - Acutis

Este documento registra o plano de evolução técnica do projeto para ser executado em etapas futuras.

## 📅 Faker 1: Segurança e Estabilidade (Imediato)

- [ ] **Mitigação de IDOR**: Validar sessão em todas as Server Actions e API Routes (Em andamento).
- [ ] **Sanitização de Inputs**: Garantir que todos os inputs de usuário sejam sanitizados para evitar XSS/Injection.

## 📅 Fase 2: Refatoração e Manutenibilidade (Curto Prazo)

- [ ] **Centralização de Datas**: Migrar lógica de parsing para `src/lib/date-utils.ts`.
- [ ] **Constantes de Negócio**: Criar `src/lib/constants.ts` para fases do funil ("vendido", "negociacao", etc) e evitar strings mágicas.
- [ ] **Typagem Estrita**: Revisar tipos `any` ou implícitos nas interfaces de resposta da IA.

## 📅 Fase 3: Performance e Escalabilidade (Médio Prazo)

- [ ] **Paginação no Dashboard**: Implementar paginação real (banco -> api -> front) nas tabelas de leads. Atualmente carrega tudo e filtra, o que vai quebrar com >1000 leads.
- [ ] **Cache Estratégico**: Usar `unstable_cache` ou `revalidateTag` do Next.js para queries pesadas de dashboard que não mudam a todo segundo.
- [ ] **Lazy Loading**: Carregar gráficos pesados somente quando entrarem na viewport.

## 📅 Fase 4: Experiência do Desenvolvedor (Longo Prazo)

- [ ] **Testes E2E**: Configurar Playwright para testes de regressão visual.
- [ ] **Storybook**: Documentar componentes de UI para garantir consistência visual.
