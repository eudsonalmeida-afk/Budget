# Contaê — Supabase

Versão com login e sincronização em nuvem.

## Antes de publicar

Confirme no Supabase:

1. As tabelas `monthly_budgets` e `expenses` foram criadas.
2. O RLS está ativado e as políticas por `user_id` foram criadas.
3. Em Authentication → URL Configuration:
   - Site URL: `https://eudsonalmeida-afk.github.io/Budget/`
   - Redirect URL: `https://eudsonalmeida-afk.github.io/Budget/`
4. O provedor de autenticação por e-mail está habilitado.

## Publicação

Substitua no GitHub os arquivos:

- `index.html`
- `style.css`
- `script.js`

A URL usada no código é a URL-base do projeto:
`https://kqeolflqbesqvkwuidcx.supabase.co`

Não use `/rest/v1/` na função `createClient`.

## Segurança

A publishable key pode ficar no navegador. Nunca publique a senha do banco, a secret key ou a service_role key. A segurança dos registros depende das políticas RLS.

## Migração

Dados da versão anterior, armazenados em localStorage, não são enviados automaticamente para a nuvem.


## Sessão persistente
A versão atual usa `persistSession`, `autoRefreshToken` e `localStorage`. Por padrão, a sessão do Supabase permanece ativa até o usuário escolher sair, salvo se houver limites de sessão configurados no painel do projeto.
