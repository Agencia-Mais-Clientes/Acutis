---
trigger: model_decision
description: Instruções sobre como rodar migrations do supabase corretamente
---

# Como criar migrations

- Sempre siga cuidadosamente a nomenclatura do arquivo, seguindo a sequencia lógica dos que já estão em 'supabase/migrations'
- Além disso, leia sempre as migrations presentes antes de implementar qualquer migration

# Como rodar migrations do supabase corretamente

## Para fazer login, caso não eseja logado

```bash
npx supabase login
```

## Para linkar com o projeto remoto

```bash
npx supabase link --project-ref jhqjuycygzjbyouxiuhm
```

## Para subir as alterações

```bash
npx supabase db push
```
