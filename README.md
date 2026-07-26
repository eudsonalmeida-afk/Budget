# Contaê — abas e compras parceladas

## Antes de publicar

No Supabase, abra **SQL Editor**, cole e execute o conteúdo de `supabase-parcelamentos.sql`.

## Depois

Substitua no GitHub os arquivos `index.html`, `style.css` e `script.js`.

## Como funcionam as parcelas

Uma compra parcelada é salva uma única vez. O app calcula automaticamente em quais meses ela deve aparecer, usando o mês inicial e o número total de parcelas. O valor mensal entra no total dos cartões, nos gastos do mês e no saldo disponível.

Ao excluir o parcelamento, ele deixa de aparecer em todos os meses.
