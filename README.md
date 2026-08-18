# Contaê — Parcelamentos V3

## Antes de publicar
Execute no **SQL Editor do Supabase** o arquivo `supabase-parcelamentos-v3.sql`.

Ele adiciona:
- data da compra;
- data exata da primeira parcela;
- tabela de exceções mensais para antecipação de parcelas.

## Depois
Substitua no GitHub:
- `index.html`
- `style.css`
- `script.js`

## Mudanças desta versão
- edição de compras parceladas;
- opção de antecipar somente a parcela do mês exibido;
- parcelas antecipadas deixam de entrar no total daquele mês, sem deslocar as demais;
- gastos à vista ordenados pelo registro mais recente;
- dropdown `Parcelamentos` dentro da Lista de Lançamentos;
- data da compra e data da primeira parcela;
- dia da primeira parcela é preservado nos meses seguintes (com ajuste para o último dia em meses menores);
- cartões de salário/gastos/saldo mais compactos;
- saldo disponível com valor maior.
