# Carteira Prime

App pessoal de controle financeiro (dashboard de finanças estilo mobile), com dados importados da planilha `Controle-de-orcamento-2026.xlsx`.

## Propósito e restrições (importante)

- **Ferramenta de uso pessoal** do Carlos e da esposa — não é produto para venda.
- **Custo zero de infraestrutura**: sem backend pago, sem banco online. Tudo estático (HTML/CSS/JS) com `localStorage`.
- Objetivo final: instalar no celular (PWA) com hospedagem gratuita (ex.: GitHub Pages).

## Stack

- HTML, CSS e JavaScript puro — sem build, sem dependências, sem backend.
- Persistência via `localStorage` do navegador.
- Mantido propositalmente simples; evoluções devem preservar essa simplicidade salvo decisão explícita.

## Estrutura

- `index.html` — home + tela de detalhe reutilizável + sheets (formulário e seletor de tipo).
- `styles.css` — visual, responsividade, temas das telas de detalhe, FAB e bottom-sheets.
- `app.js` — regras do app: roteamento por hash, cálculos, filtros, edição e persistência.
- `budget-data.js` — dados importados da planilha 2026 (usados na restauração/seed).
- `preview.html` — mockup de iPhone 17 (viewport 402×874, moldura + Dynamic Island) que carrega o app num iframe. **É o modo padrão de visualizar o app durante o desenvolvimento** — o foco da ferramenta é exclusivamente mobile.

## Arquitetura de navegação (decisão de design — jul/2026)

Seguindo referência visual estilo Mobills enviada pelo Carlos:

- **Home enxuta**: só resumos agrupados (saldo, receitas/despesas clicáveis, card de cartões, card de reservas, gráfico de balanço, rosca de categorias, pendências, orçamento, backup). Removidos (jul/2026, a pedido) os blocos "Disponível" e "Taxa de reserva" e o card **"Maior categoria"** (redundante — a maior categoria já aparece na rosca "Despesas por categoria"; o `#topCategoryMetric` e o `.metric-grid` saíram do HTML/JS, CSS `.metric` ficou como dead code inofensivo). Ideia futura do Carlos (NÃO implementar sem pedir): uma categoria de "saldo positivo do ano" acumulando o que sobra por mês. **Sem formulário de lançamento na home** e **sem lista geral de movimentos** (removida jul/2026 — os lançamentos ficam nas telas por tipo). Botão "Principal" da bottom-nav sempre leva ao topo da home (`#navHome` com scroll-to-top, mesmo já estando nela). Obs.: a aba "Transações" da bottom-nav apontava para a lista removida — hoje sem alvo (decidir depois se remove/reaponta).
- **Hero full-bleed (decisão do Carlos, jul/2026)**: a home não tem header/avatar — o card de saldo escuro encosta no topo e nas laterais (cantos arredondados só embaixo), com o seletor de mês compacto (‹ mês ›, setas coladas) centralizado dentro dele. **Navegação de mês** (jul/2026): o mês fica centralizado no topo (sem setinhas do lado) e a troca é por **setas grandes nas extremidades** do hero (`.month-edge` esquerda/direita, ids `prevMonth`/`nextMonth`) + **swipe** (`bindMonthSwipe`: arrastar ↞ esquerda = próximo mês, ↠ direita = mês anterior). Ocupa **~45% da altura** (`min-height: 45vh`), com o conteúdo distribuído (`justify-content: space-between`): mês no topo, **Saldo em conta** (grande, bloco `.balance-main`), **Estimado do mês** (bloco `.estimated-line`, fonte light) espaçado dele, e dois quick-stats embaixo: **Receitas** e **Despesas**. O botão de olho (ocultar valores) foi removido. O antigo bloco de atalhos (stories) foi removido.
- **Reserva virou card na home** (jul/2026): saiu do hero e virou `#reserveCard` (azul) abaixo do card de cartões, leva a `#/reservas`. A ordem no dashboard é: atraso → cartões → reservas → métricas → …
- **Filtro/ordenação nas telas de detalhe** (jul/2026): ícone no canto superior direito do hero (`#detailFilter`) abre o sheet `#sortSheet` com 5 opções que **reordenam** (não escondem): Não pagos primeiro (padrão), Pagos primeiro, Maior valor, Menor valor e **Agrupar por categoria**. Rótulos "pagos" adaptam por tipo (Recebidos/Reservados). Estado global `detailSort` + `sortComparator`. **Agrupar por categoria** (`sort === "category"`): ordena por nome da categoria (pt-BR) e, dentro dela, maior valor primeiro; o `renderDetail` insere um cabeçalho `.entry-group` (nome na cor da categoria + total do grupo à direita) antes do primeiro card de cada categoria. Botão **"Limpar filtro"** (`#sortClearBtn`) no fim do sheet volta ao padrão (`unpaid`).
- **Telas dedicadas por tipo** (roteamento por hash, view única `#detailView` tematizada):
  - `#/receitas` (verde), `#/despesas` (vermelho), `#/reservas` (azul).
  - Cada tela: header colorido com voltar + mês, **card de resumo flutuante** (cantos arredondados, sobreposto ao header) com "Total pendente" / "Total pago|recebido|reservado" — cada um com ícone de linha (cadeado / carteira); **Total pago sempre em verde** (`--green`), pendente na cor da seção. `status "P"` = pago/recebido.
  - **Lançamentos como cards separados** (`detailCard` em `app.js`, container `.entry-list`) — um card por item, não mais lista com divisórias. Cada card tem: dot da categoria, descrição/meta, valor, uma **pílula de status** e um **menu ⋯** (Editar/Excluir). Sem as tags antigas de status.
  - **Pílula de status**: pendente = "Pagar/Receber/Reservar" na cor-soft da seção; paga = "✓ Pago/Recebido/Reservado" verde sólido, e o card inteiro fica esmaecido (`opacity .48`). Clicar alterna via `toggleStatus`.
  - **Swipe-to-pay** (`bindSwipe`, pointer events): arrastar o card > 40% marca como pago; se já pago, arrastar para o lado oposto reabre como pendente. A camada `.entry-behind` aparece atrás. O menu ⋯ fica fora da área de `overflow:hidden` do swipe (`.entry-swipe`) para não ser cortado.
  - **Seleção múltipla (clicar e segurar)** (jul/2026): segurar ~480ms num card (long-press integrado no `bindSwipe`) entra no **modo seleção** e marca aquele card; depois **tocar** em qualquer card marca/desmarca (o `handleDetailClick` desvia pro `toggleSelect` quando `selectMode`). Uma **barra escura fixa** acima da bottom-nav (`#selectionBar`) mostra "N selecionadas" + **a soma** dos valores, com **× para limpar** (`#selectionClear` → `exitSelectMode`). Cards selecionados: contorno na cor da seção + ✓ (`.entry-card.is-selected`); no modo, `body.select-mode` esconde pagar/menu (`.entry-controls`) e o swipe-pay fica desligado. Trocar de tela (`route`) ou desmarcar todos zera o modo. `justLongPressed` engole o clique que segue o long-press (e é limpo em todo novo `pointerdown`, pro caso de long-press sem clique). Estado: `selectMode` + `selectedIds` (Set de ids).
- **Formulário em bottom-sheet** (`#entrySheet`), usado para criar e editar. O "+" da bottom-nav abre o sheet do tipo atual (em tela de detalhe) ou um seletor Receita/Despesa/Reserva (`#chooserSheet`) na home.
- **Seletor de categoria custom** (`#categorySheet`, jul/2026): o campo Categoria é um botão (`#categoryTrigger`, dot colorido + nome + chevron) que abre um bottom-sheet no padrão do app, com input "Nova categoria" + "Criar" no topo e a lista de categorias (dot colorido, selecionada destacada com check). Substituiu o `<select>` nativo, que destoava. Criar uma categoria seleciona-a na hora e persiste em `state.customCategories[type]`. `categoryNames(type)` une `categories[type]` + custom + as usadas em transações, filtrando `state.removedCategories`. O sheet abre por cima do `#entrySheet` sem fechá-lo (cada backdrop fecha só o seu sheet).
- **Editar/excluir categoria no seletor** (jul/2026): cada linha tem um menu ⋯ que abre, inline na própria linha, as opções "Renomear" e "Excluir" (sem diálogos nativos; inline porque a lista tem scroll e um popover seria cortado). Estados: `categoryMenuName` → `categoryEditingName` (campo de rename) / `categoryDeletingName` (confirmação). Editar (`renameCategoryEverywhere`) renomeia em **todos os lançamentos vinculados** + orçamentos + customizadas, esconde o nome antigo via `state.removedCategories` e garante o novo em `customCategories`. Excluir (`deleteCategoryEverywhere`) pede confirmação inline ("Apagar X e N lançamentos?") e remove a categoria e os lançamentos vinculados. As categorias predefinidas do `const categories` não são apagadas do código — ficam ocultas via `removedCategories`.
- **Contas em atraso** (jul/2026): card na home **acima** do de cartões (`#overdueCard`), só aparece quando há despesa não paga cujo **dia 15 do mês dela já passou** (`isOverdue`). Leva à rota `#/atrasadas` (tema vermelho) — tela que **cruza todos os meses** (não filtra por mês selecionado, sem seletor de mês), listando as contas atrasadas com pílula "Pagar" e menu ⋯. Marcar como paga tira a conta da lista (e a confirmação de pagamento aparece igual). É um lembrete persistente até quitar.
- **Cartões de crédito**: card compacto na home (`#cardsCard`, só total + contagem) que leva à rota `#/cartoes` (tema roxo) — tela com totais pendente/pago, detalhamento por cartão (categoria) e lista das contas. O FAB dela cria despesa. Lançamento "de cartão" = despesa cuja categoria contém "cartão" (match sem acento/caixa em `isCardTransaction`).
- **Foco mobile-only**: layout e decisões de UI pensados para celular (iPhone 17). Validar sempre pelo `preview.html`.
- **Safe areas do iPhone**: `--safe-top` (mín. 54px, cobre a Dynamic Island) e `--safe-bottom` (mín. 16px, cobre o home indicator) aplicados no header, hero das telas de detalhe, bottom-nav, sheets e toast. Scrollbar sempre oculta (app mobile).
- **Bottom-nav muda de cor por seção** via `body[data-section]` (`--accent`): verde em receitas, vermelho em despesas, azul em reservas, roxo em cartões. O "+" central é o único botão de adicionar (sem FAB), como na referência.
- **Sem Exportar/Importar no topo**: backup fica num card "Seus dados" no fim da home.
- Tipografia reduzida no mobile (saldo 2.4rem, métricas ~1.05rem) seguindo escala da referência Mobills.

## Identidade visual — repaginada "off-white vivo" (jul/2026, ATUAL)

Repaginada seguindo referências estilo Ecofin (fintech light, roxo/cores vivas). **Substitui a identidade "papel-moeda"** (guilloché desligado; sem versão dark por ora). Mantém as funções — foi só design.

- **Base off-white neutra** (`--bg #f1f1f5`), cards brancos (`--surface #fff`) com cantos bem arredondados (`--radius: 20px`), flat (sem sombra), separados por hairline `--line`.
- **Cores vivas**; **roxo = cor de marca** (home, botões, FAB, ativos): `--brand #6c5ce7`. Semânticas vivas: verde `#12b76a` (receitas), vermelho/coral `#f0453e` (despesas), azul `#2e90fa` (reservas), roxo `#7a5af8` (cartões).
- **Cards do topo em cor cheia**: o hero da home é um card **roxo** (gradiente `--hero-ink`→`--hero-ink-2`, ambos roxo); os heros de detalhe usam a cor viva da seção. `html { background }` = roxo escuro para o topo/safe-area combinar.
- **Paleta das categorias** (dots + rosca do gráfico) vivas e coerentes: roxo, azul, verde, laranja, coral, rosa, ciano, âmbar — definidas no `getCategory` (fallback) e no `const categories` do `app.js`.
- **Botões pill 100% arredondados** (999px), primário sólido na cor da seção. Inputs arredondados (12px). Tipografia mantém Archivo.
- Guilloché neutralizado via `--guilloche: linear-gradient(transparent, transparent)` (mantém a sintaxe sem editar cada uso).

### Identidade anterior — "Papel-moeda" (histórico, jul/2026)

Paleta e linguagem derivadas das cédulas do Real (substituída pela repaginada acima):

- **Fundo**: papel-moeda claro esverdeado (`--bg: #eef0e7`), superfícies quase-brancas quentes, tinta de gravura verde-escura (`--ink: #1d2b22`).
- **Cores por seção**: marca/home turquesa R$100 (`--brand: #0e6f5c`), receitas verde (`--green: #29a84e`), despesas vermelho-tomate (`--red: #ec4a2c`), reservas azul R$2 (`#2c6399`), cartões violeta R$5 (`#6a4d9e`). Verde/vermelho foram aproximados dos tons das referências do Carlos (mais vivos que o cédula original). Cada cor com variante `-dark` e `-soft`; `body[data-section]` define `--accent/--accent-dark/--accent-soft`.
- **Tipografia**: Archivo variável (Google Fonts, eixos wdth 62–125 / wght 100–900). Valores em R$ e títulos usam `font-stretch: 112–116%` (numerais "gravados" de cédula); rótulos em caixa-alta miúda espaçada (microimpressão); `tabular-nums` no body inteiro. Fallback gracioso para fonte de sistema se offline.
- **Assinatura**: guilloché em CSS puro (`--guilloche`: dois `repeating-radial-gradient` com centros deslocados) sobre os heros — card de saldo da home (cédula escura `--hero-ink`), headers das telas de detalhe e brand-mark. O card de saldo ainda tem microlinhas diagonais no `::before`.
- **Movimento**: só bottom-sheets subindo (`sheet-rise`/`backdrop-fade`); `prefers-reduced-motion` respeitado. `:focus-visible` com outline no accent.
- As cores das categorias no `app.js` (tons impressos: `#1f7a55`, `#ad3f3f`, etc.) já harmonizam com a paleta — não alterar sem motivo.

## Recorrência de lançamentos (jul/2026)

Ao adicionar (não ao editar), o formulário tem "Como repete": **Única / Fixa / Parcelada** (segmented) + stepper de parcelas.

- **Única**: um lançamento só naquele mês (comportamento antigo).
- **Fixa / essencial**: perpétua — repete todo mês até apagar. Materializada por `buildOccurrences` (12 meses iniciais) e estendida sob demanda por `ensureHorizon()` conforme o usuário navega para frente (chamada no início de `render()`).
- **Parcelada**: N meses (stepper `+/−`, 2–60). Cria N ocorrências, uma por mês, com `installmentIndex/installmentTotal`; a meta do card mostra `k/N`. Fixa mostra "Fixa".
- Cada ocorrência é um registro real em `state.transactions` (não virtual), com `seriesId` e `seriesType`. Assim totais, gráficos, filtros e status por mês funcionam sem lógica extra.
- **Data futura**: lançar com data de mês seguinte joga o item nesse mês (a view pula para o mês da data no submit).
- **Editar** com todos os campos liberados (inclusive a recorrência — decisão do Carlos, jul/2026). Se o tipo de recorrência **não muda**, altera esta ocorrência e as **seguintes** (mesmo `seriesId`, `date >= atual`). Se o tipo **muda** (ex.: transformar uma conta em Fixa), refaz a série a partir deste mês (`buildOccurrences`), preservando o histórico passado e o status da ocorrência atual.
- **Migração automática**: despesas importadas com observação "Despesas essenciais" (mas não "não essenciais") viram contas **fixas** ao carregar (`applyMigrations`), agrupadas por categoria+descrição na mesma série. Roda no load, no reset da planilha e na importação de JSON.
- **Excluir/editar série com escolha** (jul/2026): ao apagar ou editar uma conta **fixa/parcelada**, o sheet pergunta **"Só esta"** ou **"Desta em diante"** (parcelada: "Esta e as próximas"). `openConfirmDialog` aceita `options: [{label, danger, onConfirm}]` e monta os botões dinamicamente (`#confirmActions`). Delete usa `deleteSeriesOccurrence(item, "one"|"forward")`; edit usa `commitSave({..., scope})`.
- **BUG corrigido (importante)**: apagar conta fixa "não colava" porque o `ensureHorizon` **recriava** os meses no render seguinte. Agora há `state.seriesEnds[seriesId]` (cap: não recria a partir da data apagada) e `state.seriesSkips["seriesId|YYYY-MM"]` (pula o mês apagado no "só esta"). O `ensureHorizon` respeita os dois. Sem isso, delete de fixa é revertido no próximo render.
- **Pagar/despagar é imediato** (pílula ou swipe) — sem confirmação (`requestPay` só faz `setStatus`). Decisão do Carlos (jul/2026): arrastar pra pagar/despagar não deve pedir box.
- **Sheet de confirmação genérico** (`#confirmSheet`, no design do app): `openConfirmDialog({ title, desc, detailHTML, confirmLabel, danger, onConfirm })` guarda a ação em `confirmAction`; o botão Confirmar fecha o sheet e roda a ação. Usado para:
  - **Salvar** (criar/editar): `openSaveConfirm` → `commitSave`. Cancelar mantém o formulário aberto.
  - **Apagar** (decisão do Carlos, jul/2026): todo delete usa esse popup no app, **nunca `confirm()` nativo**. `deleteTransaction` (título "Apagar lançamento?/parcelas?/conta fixa?" com resumo do item) e `deleteCategory` (com contagem de vinculados) passam `danger: true` → botão "Apagar" vermelho (`.primary-btn.danger`). O seletor de categoria já tinha rename/delete inline próprios.
  - Obs.: `renameCategory` do card de limites ainda usa `prompt()` nativo (é rename, não delete; a alternativa in-app é o ✎ do seletor de categoria).

## Gráfico de balanço / projeção acumulada (home, jul/2026)

Card **"Balanço por mês"** (`.balance-panel`, kicker "Projeção") na home, posicionado **entre o card de Reservas e a rosca "Despesas por categoria"** (pedido do Carlos, ref. estilo PlannerFin: colunas em cima da rosca). Responde à pergunta "se eu seguir nesse ritmo, quanto sobra guardado até dezembro / nos próximos N meses?".

- **Colunas mês a mês** (`#balanceBars`): 12 barras (jan–dez) do ano visto, cada uma = **saldo estimado do mês** (todas as receitas − todas as despesas daquele mês; reservas ficam de fora, igual ao saldo da home). Altura ∝ |valor| relativo ao maior do ano; **verde** se positivo, **vermelho** se negativo (`is-pos`/`is-neg`). Valor compacto no topo (`compactBRL`: "1,5k", "-100"). Mês atual marcado com pontinho (`is-current`).
- **Marcar/desmarcar para somar** (decisão do Carlos): tocar numa coluna **não some** — só entra/sai da soma. Marcada = cheia (`is-on`); não marcada = esmaecida (`is-off`, opacity .32). A seleção é um `Set` de `"YYYY-MM"` em `balanceSelection` e **pode atravessar anos** (ex.: jul/26 → jun/27).
- **Projeção acumulada** (`.balance-summary`): soma o saldo estimado dos meses marcados. Rótulo "Sobra acumulada" (verde) ou "Déficit acumulado" (vermelho, `#balanceAccum.is-neg`) + subtítulo `primeiro → último · N meses · média R$ x/mês`. Vazio → "Toque nos meses para somar o período.".
- **Chips de atalho** (`#balanceChips`): "3 meses", "6 meses", "12 meses" (a partir do mês atual, `rangeFromNow`) e "Até dez" (mês atual → dez do ano atual, `defaultBalanceSelection` = seleção padrão). Chip ativo destacado quando a seleção bate com o preset (em julho, "6 meses" e "Até dez" coincidem — esperado).
- **Modo "Incluir reservas no período"** (switch `#balanceReserveToggle`, azul, entre as barras e os chips; `balanceIncludeReserve`): quando ligado, o `net` de cada mês passa a somar as **reservas** (type `saving`) — as barras e o acumulado sobem, e o rótulo vira "Sobra/Déficit acumulado **+ reservas**". Desligado (padrão), reservas ficam de fora (igual ao saldo estimado). Assim o Carlos vê "quanto tenho guardado" com ou sem o fundo de reserva. `balanceNetByKey` acumula `{income, expense, saving}`.
- **Navegação de ano**: setas `‹ ano ›` (`#balancePrevYear`/`#balanceNextYear`) + swipe horizontal nas barras (`bindHorizontalSwipe`, que **engole o clique** quando houve arrasto pra não marcar coluna sem querer). Trocar de ano **mantém a seleção** (as colunas marcadas em outro ano continuam somando).
- **Materialização do futuro**: `ensureHorizon(target)` ganhou parâmetro opcional (aditivo; default = `selectedMonth`, comportamento antigo intacto). O `renderBalanceChart` chama com o fim do ano visto (ou último mês marcado, se for além) pra as contas **fixas** futuras existirem e a projeção contá-las.
- Helpers no `app.js`: `balanceNetByKey()` (mapa mês→{income,expense} numa passada), `balKey`, `keyShort`, `rangeFromNow`, `defaultBalanceSelection`, `sameSet`, `compactBRL`, `MES_ABBR`.

## Visual achatado (decisão do Carlos, jul/2026)

Sem drop shadows nos boxes de conteúdo e no botão "+": `--shadow: none` e sombras fixas removidas de heros, cards, breakdown, entry-cards, FAB, bottom-nav. Separação por borda (`--line`) sobre o fundo papel. Mantida só a elevação funcional de overlays: bottom-sheets (`.sheet`) e o popover do menu ⋯ (`.entry-actions-menu`), que ficam sobre outro conteúdo. Anéis inset (hairlines) e o ring de foco não são drop shadows e foram mantidos.

## Ajustes mobile / iPhone (jul/2026)

- **Zoom travado**: viewport com `maximum-scale=1, user-scalable=no` + `input, select { font-size: 16px }` (16px evita o zoom automático do iOS ao focar campo). Não pode dar zoom em nada.
- **Overscroll travado (sem "faixa branca")**: `overscroll-behavior: none` em `html`/`body` e `contain` no `.sheet`. Além disso, `html { background: var(--hero-ink-2) }` (verde escuro do hero) para que a área do topo/safe-area/qualquer bounce apareça na cor do hero, nunca branca.
- **Gráfico "Despesas por categoria"**: mostra **todas** as categorias (não só top 5). Legenda com **porcentagem na frente** (share do total de despesas do mês) + nome + valor. Rodinha (conic-gradient) com todas as fatias.

## Como rodar

Basta abrir `index.html` no navegador, ou servir com `python3 -m http.server 8765`.

## Saldo por mês (decisão do Carlos, jul/2026)

Dois saldos, ambos **só com o mês selecionado** (`renderSummary`), sem carregar sobra/déficit para o mês seguinte (cada mês é independente):
- **Saldo em conta** (número grande, tempo real) = receitas **recebidas** (status `"P"`) − despesas **pagas** (status `"P"`). É o dinheiro real: só conta o que foi marcado. **Casa com o estimado** quando tudo estiver recebido/pago. Marcar receita recebida sobe; marcar despesa paga desce.
- **Saldo estimado** (linha pequena, light) = **todas** as receitas − **todas** as despesas. Projeção: fecha o mês positivo ou negativo.
- Reservas ficam **fora** desses dois cálculos (viram card próprio). Pílula/swipe mudam o saldo em conta na hora (recebido/pago).
- Decisão consciente: sem banco/cartão sincronizado, acumular saldo entre meses daria erro. No futuro, avaliar um "espaço" separado para sobra/déficit — por ora não acumular.

## Convenções

- Interface e textos do app em português (pt-BR).
- Valores em formato brasileiro (R$ 1.236,98).
- Status dos lançamentos: `"P"` = pago/recebido; vazio ou outro valor = pendente.

## Preferência de fluxo de trabalho

- O Carlos prefere que as mudanças sejam feitas **direto por código**, sem ficar abrindo a extensão do Chrome a cada passo — verificar no navegador só quando necessário ou quando ele pedir.

## PWA e hospedagem (jul/2026)

App é um **PWA instalável**, para rodar em tela cheia no celular:
- `manifest.json` (display standalone, ícones, tema `#152218`), `sw.js` (service worker) e ícones `icon-192/512/180.png` (marca "C" no verde papel-moeda, gerados via PIL — script em scratchpad, não versionado).
- `index.html` tem `<link rel="manifest">`, `apple-touch-icon`, metas `apple-mobile-web-app-*` (status bar `black-translucent`, daí o `viewport-fit=cover` + as safe-areas) e registra o `sw.js` no fim do body.
- **Service worker = stale-while-revalidate** no app shell: abre instantâneo do cache e atualiza os arquivos em segundo plano; a versão nova vale na **próxima abertura** (às vezes na segunda). Não precisa "bumpar" versão a cada deploy — o SWR já rebusca. `CACHE = "carteira-prime-v1"`.
- **Dados no `localStorage`** (fora do cache do SW): atualizar o código **nunca apaga** os lançamentos.
- **Hospedagem**: GitHub Pages (estático). Caminhos são relativos (`./`) para funcionar em subpasta `usuario.github.io/repo/`.

**Uso multiusuário (decisão do Carlos, jul/2026)**: sem login e sem sincronização. Cada aparelho tem sua própria carteira (localStorage local). Ele e a esposa cadastram cada um as suas contas no próprio celular — **não é vinculado/compartilhado** por ora. Backup manual pelo card "Seus dados" (Exportar/Importar JSON).

## Orçamento / categorias / pendências (jul/2026)

- **Seção "Orçamento" (antes "Limites")**: header com botão **"+ Categoria"** (`#addCategoryBtn`) que abre o `#budgetSheet` em **modo criar** (`openBudgetSheet()` sem nome → título "Nova categoria"). Cria categoria **standalone** (via `addCustomCategory("expense", ...)` + `state.budgets`), aparece na lista mesmo sem lançamento; conforme se gasta nela, enche a barra. Não precisa criar despesa antes.
- **Editar categoria**: mesmo `#budgetSheet` (Nome + Limite mensal, checkbox "Sem limite"). `saveCategory(oldName, newName, noLimit, limit)` renomeia em todos os lançamentos (se editar) e grava `state.budgets[nome]`. **"Sem limite" grava `0` explícito** (sobrepõe limite padrão); `renderBudgets` lê `stored !== undefined ? stored : category.budget`, filtra `removedCategories` e inclui `customCategories.expense`. Cada item mostra `gasto de limite · %`; **estouro (`is-over`)** = barra e % em vermelho.
- **Card "Pendência e alertas"** agora é **link para `#/despesas`** e ligado às despesas do mês: **Contas pendentes** = toda despesa com `status !== "P"` (não só as com status truthy — bug antigo corrigido); **Total pago** (verde) = `status === "P"`; **Maior pendência** = maior despesa não paga. (A visão geral de atrasadas continua no card "Contas em atraso".)
- **Popup de lançamentos por categoria** (jul/2026): cada card do Orçamento é clicável (`data-view-category`, `role="button"`) e abre o `#catViewSheet` (`openCatView`), um bottom-sheet no padrão do app listando os lançamentos **daquela categoria no mês selecionado** (mesma base do "gasto" da barra) — descrição, data, "· Pago" (item pago fica esmaecido) e valor. Subtítulo com contagem + total + mês. Os botões Editar/× do card continuam com prioridade (o handler dá `return` antes de abrir o popup).

## Lembrete de contas a pagar (in-app, jul/2026)

Pedido do Carlos: ser lembrado das contas do mês ainda não pagas, "depois do dia 12", até quitar tudo. **Limitação real do iOS:** um PWA no iPhone **não** dispara notificação de sistema (lock screen/central) com o app fechado sem um **servidor de push** — quebraria o "sem backend". O que dá pra fazer sem backend é um **lembrete in-app ao abrir o app**, que é o implementado.

- `#billReminderSheet`: bottom-sheet no padrão do app (🔔 + "Contas a pagar este mês" + texto com contagem e total + "Ver contas a pagar" / "Agora não").
- `maybeShowBillReminder()` roda no **init** (após `route()`) e no **`visibilitychange`** (ao voltar o foco pro app). Mostra quando: `now.getDate() >= reminderDay()` **e** há despesa não paga do **mês corrente real** (`unpaidThisMonth`, `status !== "P"`) **e** ainda não lembrou hoje (`state.lastBillReminder !== isoDay(now)`). Só aparece 1x por dia (grava `state.lastBillReminder`), e nunca por cima de outro sheet.
- **Dia configurável** (jul/2026): stepper "Lembrar a partir do dia" no **menu de configurações** (ver abaixo) — `#reminderDayMinus`/`#reminderDayPlus`, `#reminderDayValue`. `reminderDay()` lê `state.billReminderDay` limitado 1–28 (fallback `BILL_REMINDER_DAY`=12); `setReminderDay` grava e `renderReminderDay` reflete no stepper.

## Menu de configurações (bottom-nav "Mais", jul/2026)

O botão **"Mais"** (⋯) da bottom-nav virou um `<button id="navMore">` (era link pra `#insightsTitle`) que abre o sheet **`#settingsSheet`** ("Configurações") — o menu central de ajustes internos do app (pedido do Carlos: "esse Mais vira o nosso menu"). Herda o estilo dos links via seletor `.bottom-nav .nav-btn`. Estrutura em grupos (`.settings-group` + `.settings-label`). Hoje contém o **dia do lembrete de contas** (movido da home) e o **lembrete diário de lançamentos** (abaixo). `openSettings`/`closeSettings` no padrão dos outros sheets (backdrop + Escape).

- **Lembrete diário de lançamentos** (jul/2026): grupo no menu com um toggle "Me lembrar de registrar todo dia" (`#logReminderToggle`, classe `.reminder-toggle` — mesmo switch do `.reserve-toggle`) + `<input type="time" id="logReminderTime">` (aparece quando ativo). Estado em `state.logReminder = {enabled, time}` (default `{false, "21:00"}`, helpers `logReminderConfig`/`setLogReminder`/`renderLogReminderSettings`). `maybeShowLogReminder()` (init + `visibilitychange`) abre o sheet `#logReminderSheet` (📝 "Lançou tudo de hoje?", CTA "Adicionar lançamento" → `openChooser`) quando `nowHHMM >= time` e ainda não avisou hoje (`state.lastLogReminder`, 1x/dia). **Limitação honesta (na própria UI, `.settings-note`):** o aviso aparece **ao abrir o app** — notificação garantida com o celular bloqueado/app fechado exigiria servidor de push. `notifyDailyLog()` dispara um aviso de sistema via `serviceWorker.showNotification` **só se a permissão já foi concedida** (best-effort; ao ativar o toggle pede permissão sem bloquear). Entrega de lock-screen fica pendente de backend (ver Próximos passos). **Validação em device pendente** para a notificação de sistema real (no preview a permissão não é concedida).
- "Ver contas a pagar" seta `selectedMonth = new Date()` e vai pra `#/despesas`. Lógica de data isolada em `shouldRemindBills(now)` (testável com data fake).
- **Não** implementa: reconhecimento das notificações do banco (Nubank etc.) — ver Próximos passos. Push real (com app fechado) também depende de backend.

## Próximos passos possíveis
- Se um dia quiser carteira compartilhada entre os dois aparelhos, aí sim precisaria de sincronização em nuvem (quebra o "sem backend").
- **Ler notificações do banco (Nubank) e lançar sozinho** (ideia do Carlos, jul/2026 — **inviável no iPhone**): o iOS não deixa nenhum app de terceiros (muito menos um PWA) ler as notificações de **outro** app — é sandbox fechado. Só seria possível num **app nativo Android** com permissão `NotificationListenerService`. Alternativa viável já anotada: o agente por WhatsApp ([[ideia-whatsapp-agente]]) ou lançar manualmente. Push real (notificação com app fechado) exigiria servidor.
- **Lançar despesa por WhatsApp via agente de IA** (ideia do Carlos, jul/2026 — NÃO implementar sem pedir): mandar texto/áudio num WhatsApp e a IA cria o lançamento com valor/data/categoria (ref.: PlannerFin). Pipeline: WhatsApp → webhook → transcrição (Whisper) → LLM extrai JSON (Claude Haiku) → grava → confirma. Exige backend sempre ligado + banco + chaves de API pagas (centavos/msg) + sincronização — quebra o "custo zero / sem backend / localStorage por aparelho". Caminho sugerido: híbrido "caixa de entrada na nuvem" (backend só empilha pendentes numa fila por token; o app puxa/mescla/limpa ao abrir, mantendo o localStorage como dono).

## Estado atual (01/07/2026)

- Redesenho de navegação implementado (home enxuta + telas por tipo + sheets).
- Tela de cartões de crédito (`#/cartoes`) e card resumido na home implementados.
- `preview.html` criado como visualização padrão (mockup iPhone 17).
- Identidade visual "Papel-moeda" aplicada (paleta cédula, Archivo variável, guilloché) — conferida em screenshot no preview (home, despesas e sheet OK).
- Ajustes do Carlos após ver o preview: header/avatar removidos, hero full-bleed com mês dentro do card, stories removido e card de cartões promovido para o topo do dashboard — implementados e conferidos no preview.
- Telas de detalhe reformuladas: resumo flutuante com ícones + Total pago em verde, lançamentos como cards separados, pílula de status Pagar/Pago (toggle), menu ⋯ (Editar/Excluir) e swipe-to-pay. Verde/vermelho aproximados das referências. Conferido no preview (cartões: toggle, menu e swipe OK).
- Recorrência (Única/Fixa/Parcelada) + confirmação ao pagar + visual achatado (sem sombras) implementados e conferidos no preview: parcelada gera k/N por mês, confirmação abre sheet, agosto mostra 2/3 corretamente.
- Contas "Despesas essenciais" migradas para fixas automaticamente e edição com recorrência liberada — conferido no preview (essenciais mostram "· Fixa"; editar DARF/MEI abre com Fixa ativa e opções clicáveis).
- Seletor de categoria custom em bottom-sheet (substituiu o `<select>` nativo) com "Nova categoria" no topo — conferido no preview (abre no padrão, criar "Pets" seleciona e fecha).
- Editar/excluir por categoria no seletor (inline): editar renomeia em todos os lançamentos vinculados; excluir confirma inline com a contagem. Conferido no preview (Academia→Academia Fit sem sobra; excluir mostrou "e 14 lançamentos").
- Menu ⋯ por categoria (Renomear/Excluir inline) no lugar dos dois ícones — conferido no preview.
- Card "Contas em atraso" na home (acima de cartões) + rota `#/atrasadas` cross-month — conferido no preview (115 contas/R$ 23.481,70; pagar tira da lista e cai para 114). Saldo por mês (sem carryover) confirmado como comportamento atual desejado.
- Confirmação movida do pagar para o salvar: pagar/despagar (pílula/swipe) é imediato; criar/editar abre confirmação. Conferido no preview.
- Home com dois saldos (em conta = recebido − pago; estimado = tudo − tudo, casam no final), reserva movida para card próprio, filtro/ordenação nas telas de detalhe, card ~45vh sem olho mágico, confirmação de exclusão in-app — conferidos no preview.
- PWA implementado (manifest + service worker SWR + ícones) para instalar no celular; dados no localStorage, sem login, carteiras por aparelho. SW registra e controla a página (conferido).
