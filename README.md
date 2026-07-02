# Carteira Prime

App pessoal de controle financeiro inspirado em dashboards mobile de finanças.

## Como abrir

Abra `index.html` no navegador.

O app nao precisa de servidor, login ou banco de dados. Os dados ficam salvos no `localStorage` do navegador.

## Arquivos principais

- `index.html`: estrutura da interface.
- `styles.css`: visual, responsividade e componentes.
- `app.js`: regras do app, calculos, filtros, edicao e persistencia.
- `budget-data.js`: dados importados da planilha `Controle-de-orcamento-2026.xlsx`.

## Funcionalidades atuais

- Resumo mensal de saldo, receitas, despesas e reservas.
- Grafico de despesas por categoria.
- Pendencias e alertas por status.
- Cadastro, edicao e exclusao de lancamentos.
- Edicao e exclusao de categorias.
- Importacao/exportacao de backup em JSON.
- Restauracao dos dados da planilha 2026.

## Observacoes para continuar no Cursor

Este projeto foi mantido propositalmente simples: HTML, CSS e JavaScript puro.

Para evoluir, bons proximos passos seriam:

- trocar `localStorage` por banco local ou backend;
- adicionar cadastro manual de novas categorias com limite mensal;
- criar tela dedicada para cartoes de credito;
- transformar em PWA para instalar no celular.
