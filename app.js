const storageKey = "carteira-prime-data-v1";
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const monthOnly = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const importedData = globalThis.CARTEIRA_IMPORTED_DATA;

const categories = {
  income: [
    { name: "Salário", icon: "S", color: "#12b76a", tint: "#daf6ea" },
    { name: "Freelance", icon: "F", color: "#2e90fa", tint: "#e1eefd" },
    { name: "Investimentos", icon: "I", color: "#7a5af8", tint: "#ece7fe" },
    { name: "Outras entradas", icon: "+", color: "#06b6d4", tint: "#d5f4fa" },
  ],
  expense: [
    { name: "Moradia", icon: "M", color: "#f79009", tint: "#fdeccb", budget: 2800 },
    { name: "Mercado", icon: "G", color: "#f0453e", tint: "#fde3e1", budget: 1600 },
    { name: "Transporte", icon: "T", color: "#2e90fa", tint: "#e1eefd", budget: 650 },
    { name: "Saúde", icon: "H", color: "#12b76a", tint: "#daf6ea", budget: 700 },
    { name: "Lazer", icon: "L", color: "#ec4899", tint: "#fce4f2", budget: 900 },
    { name: "Assinaturas", icon: "A", color: "#7a5af8", tint: "#ece7fe", budget: 320 },
    { name: "Outras saídas", icon: "-", color: "#eab308", tint: "#fbf0c4", budget: 900 },
  ],
  saving: [
    { name: "Reserva de emergência", icon: "R", color: "#f79009", tint: "#fdeccb" },
    { name: "Investimento mensal", icon: "I", color: "#12b76a", tint: "#daf6ea" },
    { name: "Objetivo futuro", icon: "O", color: "#2e90fa", tint: "#e1eefd" },
  ],
};

const typeMeta = {
  income: {
    route: "#/receitas",
    title: "Receitas",
    pendingLabel: "Total pendente",
    paidLabel: "Total recebido",
    emptyTitle: "Ops, você não possui receitas registradas",
    emptyHint: "Adicione suas receitas para o mês atual usando o botão (+).",
    newLabel: "Nova receita",
    sign: "+",
  },
  expense: {
    route: "#/despesas",
    title: "Despesas",
    pendingLabel: "Total pendente",
    paidLabel: "Total pago",
    emptyTitle: "Ops, você não possui despesas registradas",
    emptyHint: "Adicione seus gastos para o mês atual usando o botão (+).",
    newLabel: "Nova despesa",
    sign: "-",
  },
  saving: {
    route: "#/reservas",
    title: "Reservas",
    pendingLabel: "Total pendente",
    paidLabel: "Total reservado",
    emptyTitle: "Ops, você não possui reservas registradas",
    emptyHint: "Adicione suas reservas para o mês atual usando o botão (+).",
    newLabel: "Nova reserva",
    sign: "-",
  },
  cards: {
    route: "#/cartoes",
    title: "Cartões de crédito",
    pendingLabel: "Total pendente",
    paidLabel: "Total pago",
    emptyTitle: "Ops, você não possui contas de cartão",
    emptyHint: "Adicione despesas com \"cartão\" no nome da categoria usando o botão (+).",
    newLabel: "Nova despesa de cartão",
    sign: "-",
  },
  overdue: {
    route: "#/atrasadas",
    title: "Contas em atraso",
    pendingLabel: "Total em atraso",
    paidLabel: "Contas",
    emptyTitle: "Nenhuma conta em atraso",
    emptyHint: "Tudo em dia! Uma despesa não paga aparece aqui depois do dia 15 do mês dela.",
    newLabel: "Nova despesa",
    sign: "-",
  },
};

const routes = Object.fromEntries(Object.entries(typeMeta).map(([type, meta]) => [meta.route, type]));

const sampleTransactions = [
  transaction("income", "Salário", "Salário mensal", 9800, daysAgo(13), ""),
  transaction("income", "Freelance", "Projeto pontual", 1800, daysAgo(6), "Landing page"),
  transaction("expense", "Moradia", "Aluguel", 2450, daysAgo(12), ""),
  transaction("expense", "Mercado", "Compras da semana", 642.8, daysAgo(4), ""),
  transaction("expense", "Transporte", "Combustível", 220, daysAgo(3), ""),
  transaction("expense", "Lazer", "Jantar", 186.4, daysAgo(2), ""),
  transaction("expense", "Assinaturas", "Streaming e apps", 119.9, daysAgo(10), ""),
  transaction("saving", "Reserva de emergência", "Aporte mensal", 1500, daysAgo(5), ""),
  transaction("saving", "Investimento mensal", "Tesouro/IPCA", 900, daysAgo(1), ""),
];

let selectedMonth = new Date();
let selectedType = "income";
let detailType = null;
let valuesHidden = false;
// Gráfico de balanço/projeção (home): ano visto + meses marcados para somar a projeção.
let balanceYear = new Date().getFullYear();
let balanceSelection = null; // Set de "YYYY-MM"; inicializa no primeiro render (mês atual → dez).
let balanceIncludeReserve = false; // modo "somar reservas" no balanço/projeção.
let state = loadState();
saveState();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function transaction(type, category, description, amount, date, note) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    type,
    category,
    description,
    amount,
    date,
    note,
  };
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toInputDate(date);
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function shiftMonth(isoDate, months) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toInputDate(target);
}

const FIXED_INITIAL_MONTHS = 12;

function buildOccurrences(base, recurrence, installments) {
  if (recurrence === "installment") {
    const total = Math.min(60, Math.max(2, installments));
    const seriesId = newId();
    return Array.from({ length: total }, (_, index) => ({
      ...base, id: newId(), status: "", date: shiftMonth(base.date, index),
      seriesId, seriesType: "installment", installmentIndex: index + 1, installmentTotal: total,
    }));
  }
  if (recurrence === "fixed") {
    const seriesId = newId();
    return Array.from({ length: FIXED_INITIAL_MONTHS }, (_, index) => ({
      ...base, id: newId(), status: "", date: shiftMonth(base.date, index),
      seriesId, seriesType: "fixed",
    }));
  }
  return [{ ...base, id: newId(), status: "", seriesType: "single" }];
}

// Contas fixas são "perpétuas": materializa novas ocorrências conforme o usuário navega para frente.
function ensureHorizon(target = selectedMonth) {
  const targetKey = monthKey(target);
  const ends = state.seriesEnds || {};
  const skips = state.seriesSkips || {};
  const latest = new Map();
  state.transactions.forEach((item) => {
    if (item.seriesType === "fixed" && item.seriesId) {
      const current = latest.get(item.seriesId);
      if (!current || item.date > current.date) latest.set(item.seriesId, item);
    }
  });
  let added = false;
  latest.forEach((template) => {
    const end = ends[template.seriesId]; // conta fixa apagada "daqui em diante": não recriar >= end
    let next = shiftMonth(template.date, 1);
    while (next.slice(0, 7) <= targetKey) {
      if (end && next >= end) break;
      if (!skips[`${template.seriesId}|${next.slice(0, 7)}`]) {
        state.transactions.push({
          type: template.type, category: template.category, description: template.description,
          amount: template.amount, note: template.note, date: next, status: "",
          seriesId: template.seriesId, seriesType: "fixed", id: newId(),
        });
        added = true;
      }
      next = shiftMonth(next, 1);
    }
  });
  if (added) saveState();
}

function recurNote(item) {
  if (item.installmentTotal) return `${item.installmentIndex}/${item.installmentTotal}`;
  if (item.seriesType === "fixed") return "Fixa";
  return "";
}

// Despesas com observação "essenciais" (mas não "não essenciais") viram contas fixas,
// agrupadas por categoria+descrição na mesma série.
function applyMigrations(data) {
  if (!Array.isArray(data?.transactions)) return data;
  const groups = new Map();
  data.transactions.forEach((item) => {
    if (item.seriesType) return;
    const note = (item.note || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const essential = item.type === "expense" && note.includes("essencia") && !note.includes("nao essencia");
    if (!essential) return;
    const key = `${item.category}|${item.description}`;
    if (!groups.has(key)) groups.set(key, newId());
    item.seriesType = "fixed";
    item.seriesId = groups.get(key);
  });
  return data;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.transactions)) return applyMigrations(saved);
  } catch {}
  if (Array.isArray(importedData?.transactions)) return applyMigrations(cloneData(importedData));
  return { transactions: sampleTransactions };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function inSelectedMonth(item) {
  return item.date.slice(0, 7) === monthKey(selectedMonth);
}

function selectedTransactions() {
  return state.transactions.filter(inSelectedMonth);
}

function totals(items = selectedTransactions()) {
  return items.reduce((acc, item) => {
    acc[item.type] += Number(item.amount);
    return acc;
  }, { income: 0, expense: 0, saving: 0 });
}

function format(value) {
  return brl.format(value || 0);
}

function money(value) {
  return valuesHidden ? "R$ •••••" : format(value);
}

function getCategory(name, type = "expense") {
  const known = categories[type].find((item) => item.name === name);
  if (known) return known;
  const palette = [
    { color: "#7a5af8", tint: "#ece7fe" },
    { color: "#2e90fa", tint: "#e1eefd" },
    { color: "#12b76a", tint: "#daf6ea" },
    { color: "#f79009", tint: "#fdeccb" },
    { color: "#f0453e", tint: "#fde3e1" },
    { color: "#ec4899", tint: "#fce4f2" },
    { color: "#06b6d4", tint: "#d5f4fa" },
    { color: "#eab308", tint: "#fbf0c4" },
  ];
  const index = Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % palette.length;
  return {
    name,
    icon: name.replace(/[^A-Za-zÀ-ÿ0-9]/g, "").slice(0, 1).toUpperCase() || "?",
    ...palette[index],
  };
}

function capitalize(text) {
  return text.replace(/^\w|^./, (letter) => letter.toUpperCase());
}

function setMonthLabel() {
  const label = capitalize(monthName.format(selectedMonth));
  $("#currentMonth").textContent = label;
  $("#detailMonthLabel").textContent = capitalize(monthOnly.format(selectedMonth));
}

function customCats(type) {
  return state.customCategories?.[type] || [];
}

function addCustomCategory(type, name) {
  if (!state.customCategories) state.customCategories = {};
  if (!state.customCategories[type]) state.customCategories[type] = [];
  if (!state.customCategories[type].includes(name)) state.customCategories[type].push(name);
  saveState();
}

function categoryNames(type) {
  const removed = new Set(state.removedCategories || []);
  const fromTransactions = state.transactions.filter((item) => item.type === type).map((item) => item.category);
  const names = [...new Set([...categories[type].map((category) => category.name), ...customCats(type), ...fromTransactions])];
  return names.filter((name) => !removed.has(name)).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// Renomeia a categoria em todos os lançamentos vinculados (e em orçamentos/customizadas).
function renameCategoryEverywhere(oldName, newName) {
  const clean = newName.trim();
  if (!clean || clean === oldName) return false;
  state.transactions.forEach((item) => { if (item.category === oldName) item.category = clean; });
  if (state.customCategories) {
    Object.keys(state.customCategories).forEach((type) => {
      const index = state.customCategories[type].indexOf(oldName);
      if (index >= 0) state.customCategories[type][index] = clean;
    });
  }
  if (state.budgets?.[oldName] !== undefined) {
    state.budgets[clean] = state.budgets[oldName];
    delete state.budgets[oldName];
  }
  if (!state.removedCategories) state.removedCategories = [];
  if (!state.removedCategories.includes(oldName)) state.removedCategories.push(oldName);
  state.removedCategories = state.removedCategories.filter((name) => name !== clean);
  addCustomCategory(selectedType, clean);
  if ($("#category").value === oldName) setCategory(clean);
  saveState();
  render();
  return true;
}

function deleteCategoryEverywhere(name) {
  const count = state.transactions.filter((item) => item.category === name).length;
  state.transactions = state.transactions.filter((item) => item.category !== name);
  if (state.customCategories) {
    Object.keys(state.customCategories).forEach((type) => {
      state.customCategories[type] = state.customCategories[type].filter((item) => item !== name);
    });
  }
  if (state.budgets?.[name] !== undefined) delete state.budgets[name];
  if (!state.removedCategories) state.removedCategories = [];
  if (!state.removedCategories.includes(name)) state.removedCategories.push(name);
  if ($("#category").value === name) setCategory(categoryNames(selectedType)[0] || "");
  saveState();
  render();
  return count;
}

function setCategory(name) {
  $("#category").value = name || "";
  const dot = $("#categoryTriggerDot");
  const label = $("#categoryTriggerName");
  if (name) {
    const category = getCategory(name, selectedType);
    dot.hidden = false;
    dot.textContent = category.icon;
    dot.style.setProperty("--tone", category.color);
    dot.style.setProperty("--tint", category.tint);
    label.textContent = name;
    label.classList.remove("is-placeholder");
  } else {
    dot.hidden = true;
    label.textContent = "Selecione uma categoria";
    label.classList.add("is-placeholder");
  }
}

let categoryEditingName = null;
let categoryDeletingName = null;
let categoryMenuName = null;

function renderCategorySheet() {
  const current = $("#category").value;
  $("#categoryOptions").innerHTML = categoryNames(selectedType).map((name) => {
    const category = getCategory(name, selectedType);
    const safe = escapeHtml(name);
    if (name === categoryEditingName) {
      return `
        <form class="category-edit-row" data-cat-save="${safe}">
          <input class="cat-edit-input" name="catName" type="text" value="${safe}" aria-label="Novo nome da categoria" />
          <button class="cat-save" type="submit">Salvar</button>
          <button class="cat-cancel" type="button" data-cat-cancel aria-label="Cancelar">×</button>
        </form>
      `;
    }
    if (name === categoryDeletingName) {
      const count = state.transactions.filter((item) => item.category === name).length;
      const detail = count ? ` e ${count} lançamento${count === 1 ? "" : "s"}` : "";
      return `
        <div class="category-option is-confirm">
          <span class="cat-confirm-text">Apagar "${safe}"${detail}?</span>
          <button class="cat-confirm-yes" type="button" data-cat-delete-yes="${safe}">Apagar</button>
          <button class="cat-confirm-no" type="button" data-cat-delete-no>Cancelar</button>
        </div>
      `;
    }
    if (name === categoryMenuName) {
      return `
        <div class="category-option is-menu" style="--tone:${category.color}; --tint:${category.tint}">
          <span class="category-dot" aria-hidden="true">${category.icon}</span>
          <span class="category-option-name">${safe}</span>
          <button type="button" class="cat-action" data-cat-edit="${safe}">Renomear</button>
          <button type="button" class="cat-action danger" data-cat-delete="${safe}">Excluir</button>
          <button type="button" class="cat-menu" data-cat-menu-close aria-label="Fechar">×</button>
        </div>
      `;
    }
    return `
      <div class="category-option${name === current ? " is-selected" : ""}" style="--tone:${category.color}; --tint:${category.tint}">
        <button type="button" class="category-pick" data-category="${safe}">
          <span class="category-dot" aria-hidden="true">${category.icon}</span>
          <span class="category-option-name">${safe}</span>
          <span class="category-option-check" aria-hidden="true">✓</span>
        </button>
        <button type="button" class="cat-menu" data-cat-menu="${safe}" aria-label="Ações de ${safe}" aria-haspopup="true">⋯</button>
      </div>
    `;
  }).join("");
  const input = $("#categoryOptions .cat-edit-input");
  if (input) { input.focus(); input.select(); }
}

function openCategorySheet() {
  categoryEditingName = null;
  categoryDeletingName = null;
  categoryMenuName = null;
  renderCategorySheet();
  $("#newCategoryInput").value = "";
  $("#categorySheet").hidden = false;
}

function closeCategorySheet() {
  $("#categorySheet").hidden = true;
}

function renderSummary() {
  const monthItems = selectedTransactions();
  const total = totals(monthItems);
  // Saldo em conta (tempo real): só o que foi de fato marcado — recebido menos pago.
  // Quando tudo estiver recebido/pago, casa exatamente com o estimado.
  const receivedIncome = monthItems
    .filter((item) => item.type === "income" && item.status === "P")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const paidExpense = monthItems
    .filter((item) => item.type === "expense" && item.status === "P")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const accountBalance = receivedIncome - paidExpense;
  // Saldo estimado: tudo a receber menos tudo a pagar (fecha o mês no positivo ou negativo).
  const estimated = total.income - total.expense;

  $("#netBalance").textContent = money(accountBalance);
  $("#estimatedBalance").textContent = money(estimated);
  $("#incomeTotal").textContent = money(total.income);
  $("#expenseTotal").textContent = money(total.expense);
}

function renderReserve() {
  const items = selectedTransactions().filter((item) => item.type === "saving");
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
  $("#reserveTotal").textContent = money(total);
  $("#reserveCount").textContent = items.length
    ? `${items.length} reserva${items.length === 1 ? "" : "s"} no mês`
    : "Nenhuma reserva no mês.";
}

function renderCategoryChart() {
  const grouped = groupExpenses(); // todas as categorias do mês
  const total = grouped.reduce((sum, item) => sum + item.total, 0);
  const donut = $("#categoryDonut");
  const legend = $("#categoryLegend");

  $("#chartTotal").textContent = money(total);
  const centerLabel = `<span class="donut-center"><strong>${money(total)}</strong></span>`;
  if (!grouped.length || total <= 0) {
    donut.style.background = "conic-gradient(var(--surface-2) 0 100%)";
    donut.innerHTML = "";
    legend.innerHTML = `<p class="empty-inline">Sem despesas neste mês.</p>`;
    return;
  }

  let cursor = 0;
  const stops = grouped.map((item) => {
    const category = getCategory(item.category, "expense");
    const start = cursor;
    cursor += (item.total / total) * 100;
    return `${category.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });
  donut.style.background = `conic-gradient(${stops.join(", ")})`;
  donut.innerHTML = centerLabel;
  legend.innerHTML = grouped.map((item) => {
    const category = getCategory(item.category, "expense");
    const pct = Math.round((item.total / total) * 100);
    return `
      <div class="legend-item">
        <i style="background:${category.color}"></i>
        <span class="legend-pct">${pct}%</span>
        <span class="legend-name">${escapeHtml(item.category)}</span>
        <strong>${money(item.total)}</strong>
      </div>
    `;
  }).join("");
}

// --- Gráfico de balanço / projeção acumulada (home) ---
const MES_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function balKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function currentMonthKey() {
  const now = new Date();
  return balKey(now.getFullYear(), now.getMonth());
}

// Seleção padrão: mês atual até dezembro do ano atual.
function defaultBalanceSelection() {
  const now = new Date();
  const set = new Set();
  for (let m = now.getMonth(); m <= 11; m += 1) set.add(balKey(now.getFullYear(), m));
  return set;
}

// N meses a partir do mês atual (pode atravessar o ano).
function rangeFromNow(months) {
  const now = new Date();
  const set = new Set();
  for (let i = 0; i < months; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    set.add(balKey(d.getFullYear(), d.getMonth()));
  }
  return set;
}

function sameSet(a, b) {
  if (!a || a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

function keyShort(key) {
  const [y, m] = key.split("-");
  return `${MES_ABBR[Number(m) - 1]}/${y.slice(2)}`;
}

// Totais por mês (receitas, despesas, reservas). Reservas só entram no net no modo "somar reservas".
function balanceNetByKey() {
  const map = new Map();
  state.transactions.forEach((item) => {
    const key = item.date.slice(0, 7);
    const entry = map.get(key) || { income: 0, expense: 0, saving: 0 };
    if (item.type === "income") entry.income += Number(item.amount);
    else if (item.type === "expense") entry.expense += Number(item.amount);
    else if (item.type === "saving") entry.saving += Number(item.amount);
    map.set(key, entry);
  });
  return map;
}

function renderBalanceChart() {
  if (!balanceSelection) balanceSelection = defaultBalanceSelection();

  // Estende as contas fixas até o fim do ano visto (e até o último mês marcado, se for além).
  const selectedKeys = [...balanceSelection].sort();
  const lastShown = balKey(balanceYear, 11);
  const lastSel = selectedKeys.length ? selectedKeys[selectedKeys.length - 1] : lastShown;
  const target = lastSel > lastShown ? lastSel : lastShown;
  ensureHorizon(new Date(Number(target.slice(0, 4)), Number(target.slice(5, 7)) - 1, 1));

  const net = balanceNetByKey();
  const netOf = (key) => {
    const entry = net.get(key);
    if (!entry) return 0;
    return entry.income - entry.expense + (balanceIncludeReserve ? entry.saving : 0);
  };
  const currentKey = currentMonthKey();

  // 12 barras do ano visto.
  const values = [];
  let maxAbs = 0;
  for (let m = 0; m < 12; m += 1) {
    const key = balKey(balanceYear, m);
    const value = netOf(key);
    values.push({ key, value, month: m });
    maxAbs = Math.max(maxAbs, Math.abs(value));
  }

  $("#balanceYear").textContent = balanceYear;
  $("#balanceBars").innerHTML = values.map(({ key, value, month }) => {
    const selected = balanceSelection.has(key);
    const isCurrent = key === currentKey;
    const height = maxAbs > 0 ? Math.max(4, Math.round((Math.abs(value) / maxAbs) * 100)) : 4;
    const cls = [
      "balance-bar",
      value < 0 ? "is-neg" : "is-pos",
      selected ? "is-on" : "is-off",
      isCurrent ? "is-current" : "",
    ].filter(Boolean).join(" ");
    const label = value !== 0 && !valuesHidden ? compactBRL(value) : "";
    return `
      <button type="button" class="${cls}" data-bal-month="${key}" aria-pressed="${selected}" aria-label="${MES_ABBR[month]} ${balanceYear}: ${format(value)}${selected ? ", marcado" : ""}">
        <span class="bal-val">${label}</span>
        <span class="bal-track"><i style="height:${height}%"></i></span>
        <span class="bal-mon">${MES_ABBR[month]}</span>
      </button>
    `;
  }).join("");

  // Chips ativos.
  const presets = { "3": rangeFromNow(3), "6": rangeFromNow(6), "12": rangeFromNow(12), dez: defaultBalanceSelection() };
  $$("#balanceChips [data-bal-preset]").forEach((chip) => {
    chip.classList.toggle("is-active", sameSet(balanceSelection, presets[chip.dataset.balPreset]));
  });

  // Projeção acumulada das barras marcadas.
  const acc = selectedKeys.reduce((sum, key) => sum + netOf(key), 0);
  const count = selectedKeys.length;
  const accEl = $("#balanceAccum");
  accEl.textContent = money(acc);
  accEl.classList.toggle("is-neg", acc < 0);
  const withReserve = balanceIncludeReserve ? " + reservas" : "";
  $("#balanceAccumLabel").textContent = (acc < 0 ? "Déficit acumulado" : "Sobra acumulada") + withReserve;
  const reserveToggle = $("#balanceReserveToggle");
  if (reserveToggle) {
    reserveToggle.classList.toggle("is-on", balanceIncludeReserve);
    reserveToggle.setAttribute("aria-pressed", String(balanceIncludeReserve));
  }
  if (count) {
    const avg = acc / count;
    $("#balanceRange").textContent = `${keyShort(selectedKeys[0])} → ${keyShort(selectedKeys[count - 1])} · ${count} ${count === 1 ? "mês" : "meses"} · média ${format(avg)}/mês`;
  } else {
    $("#balanceRange").textContent = "Toque nos meses para somar o período.";
  }
}

// Valor curto para o topo da coluna: "1,5k", "-980", "12k".
function compactBRL(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}${k.toFixed(k >= 10 ? 0 : 1).replace(".", ",")}k`;
  }
  return `${sign}${Math.round(abs)}`;
}

function renderAlerts() {
  const monthItems = selectedTransactions();
  // Ligado às despesas do mês: pendente = toda despesa não paga; pago = status "P".
  const unpaid = monthItems.filter((item) => item.type === "expense" && item.status !== "P");
  const paid = monthItems.filter((item) => item.type === "expense" && item.status === "P");
  const pendingValue = unpaid.reduce((sum, item) => sum + Number(item.amount), 0);
  const paidValue = paid.reduce((sum, item) => sum + Number(item.amount), 0);
  const nextExpense = [...unpaid].sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  $("#alertGrid").innerHTML = `
    <article class="alert-card">
      <span>Contas pendentes</span>
      <strong>${money(pendingValue)}</strong>
      <small>${unpaid.length} despesa${unpaid.length === 1 ? "" : "s"} não paga${unpaid.length === 1 ? "" : "s"} no mês.</small>
    </article>
    <article class="alert-card paid">
      <span>Total pago</span>
      <strong>${money(paidValue)}</strong>
      <small>${paid.length} despesa${paid.length === 1 ? "" : "s"} paga${paid.length === 1 ? "" : "s"} no mês.</small>
    </article>
    <article class="alert-card">
      <span>Maior pendência</span>
      <strong>${nextExpense ? money(nextExpense.amount) : "-"}</strong>
      <small>${nextExpense ? escapeHtml(nextExpense.description) : "Nada pendente neste mês."}</small>
    </article>
  `;
}

function isCardTransaction(item) {
  const category = item.category.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return item.type === "expense" && category.includes("cartao");
}

// Despesa não paga vira "em atraso" quando o dia 15 do mês dela já passou.
function isOverdue(item) {
  if (item.type !== "expense" || item.status === "P") return false;
  const [year, month] = item.date.split("-").map(Number);
  const threshold = new Date(year, month - 1, 15);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > threshold;
}

function transactionRow(item, { withActions = true } = {}) {
  const category = getCategory(item.category, item.type);
  const sign = item.type === "income" ? "+" : "-";
  const date = shortDate.format(new Date(`${item.date}T12:00:00`));
  const extra = recurNote(item);
  return `
    <article class="transaction" style="--tone:${category.color}; --tint:${category.tint}">
      <span class="category-dot" aria-hidden="true">${category.icon}</span>
      <div class="transaction-info">
        <strong>${escapeHtml(item.description)}</strong>
        <span>${escapeHtml(item.category)} · ${date}${item.note ? ` · ${escapeHtml(item.note)}` : ""}${extra ? ` · ${extra}` : ""}</span>
      </div>
      <span class="status-badge${item.status ? "" : " is-empty"}">${item.status ? escapeHtml(item.status) : "-"}</span>
      <span class="transaction-amount ${item.type}">${valuesHidden ? "••••" : `${sign}${format(item.amount)}`}</span>
      ${withActions ? `
      <div class="item-actions transaction-actions">
        <button class="edit-btn" type="button" data-edit="${item.id}" aria-label="Editar ${escapeHtml(item.description)}">Editar</button>
        <button class="delete-btn" type="button" data-delete="${item.id}" aria-label="Excluir ${escapeHtml(item.description)}">×</button>
      </div>` : ""}
    </article>
  `;
}

function statusLabel(type, paid) {
  const pairs = {
    income: ["Receber", "Recebido"],
    saving: ["Reservar", "Reservado"],
    expense: ["Pagar", "Pago"],
    cards: ["Pagar", "Pago"],
  };
  const pair = pairs[type] || pairs.expense;
  return paid ? pair[1] : pair[0];
}

function detailCard(item, labelType) {
  const category = getCategory(item.category, item.type);
  const sign = item.type === "income" ? "+" : "-";
  const date = shortDate.format(new Date(`${item.date}T12:00:00`));
  const paid = item.status === "P";
  const undoLabel = statusLabel(labelType, false);
  const extra = recurNote(item);
  return `
    <article class="entry-card${paid ? " is-paid" : ""}" data-id="${item.id}" style="--tone:${category.color}; --tint:${category.tint}">
      <div class="entry-swipe">
        <button class="entry-behind" type="button" data-pay="${item.id}" tabindex="-1" aria-hidden="true">
          <span>${paid ? undoLabel : statusLabel(labelType, true)}</span>
        </button>
        <div class="entry-face">
          <span class="category-dot" aria-hidden="true">${category.icon}</span>
          <div class="entry-info">
            <strong>${escapeHtml(item.description)}</strong>
            <span>${escapeHtml(item.category)} · ${date}${item.note ? ` · ${escapeHtml(item.note)}` : ""}${extra ? ` · ${extra}` : ""}</span>
          </div>
          <span class="entry-amount ${item.type}">${valuesHidden ? "••••" : `${sign}${format(item.amount)}`}</span>
          <div class="entry-controls">
            <button class="pay-pill${paid ? " is-paid" : ""}" type="button" data-pay="${item.id}">${statusLabel(labelType, paid)}</button>
            <button class="entry-menu" type="button" data-menu="${item.id}" aria-label="Ações do lançamento" aria-haspopup="true">⋯</button>
          </div>
        </div>
      </div>
      <div class="entry-actions-menu" data-actions="${item.id}" hidden>
        <button type="button" data-edit="${item.id}">Editar</button>
        <button type="button" data-delete="${item.id}">Excluir</button>
      </div>
    </article>
  `;
}

function setStatus(id, status) {
  const item = state.transactions.find((transactionItem) => transactionItem.id === id);
  if (!item) return;
  item.status = status;
  saveState();
  render();
  const done = { income: "recebido", saving: "reservado" }[item.type] || "pago";
  toast(status === "P" ? `Marcado como ${done}` : "Marcado como pendente");
}

// Pagar/despagar é imediato (via pílula ou swipe) — sem confirmação.
function requestPay(id) {
  const item = state.transactions.find((transactionItem) => transactionItem.id === id);
  if (!item) return;
  setStatus(id, item.status === "P" ? "" : "P");
}

// Sheet de confirmação genérico (no design do app) — salvar e apagar, 1+ opções.
let confirmActions = [];

function openConfirmDialog({ title, desc = "", detailHTML = "", confirmLabel = "Confirmar", danger = false, onConfirm, options }) {
  confirmActions = options || [{ label: confirmLabel, danger, onConfirm }];
  $("#confirmTitle").textContent = title;
  const descEl = $("#confirmDesc");
  descEl.textContent = desc;
  descEl.hidden = !desc;
  const detailEl = $("#confirmDetail");
  detailEl.innerHTML = detailHTML;
  detailEl.hidden = !detailHTML;
  $("#confirmActions").innerHTML = confirmActions.map((opt, index) =>
    `<button class="primary-btn${opt.danger ? " danger" : ""}" type="button" data-confirm-action="${index}">${escapeHtml(opt.label)}</button>`,
  ).join("") + `<button class="secondary-btn" type="button" data-confirm-cancel>Cancelar</button>`;
  $("#confirmSheet").hidden = false;
  document.body.classList.add("sheet-open");
}

function runConfirmAction(index) {
  const action = confirmActions[index]?.onConfirm;
  closeConfirm();
  if (action) action();
}

function openSaveConfirm(base, editingId, recurrence, installments) {
  const sign = base.type === "income" ? "+" : "-";
  const date = shortDate.format(new Date(`${base.date}T12:00:00`));
  const recurText = recurrence === "fixed" ? "Fixa · todo mês"
    : recurrence === "installment" ? `Parcelada · ${installments}x`
    : "Única";
  const detailHTML = `
    <strong>${escapeHtml(base.description)}</strong>
    <span>${escapeHtml(base.category)} · ${date} · ${recurText}</span>
    <em class="${base.type}">${sign}${format(base.amount)}</em>
  `;
  const original = editingId ? state.transactions.find((item) => item.id === editingId) : null;
  const seriesEdit = original?.seriesId && (original.seriesType || "single") === recurrence;
  if (seriesEdit) {
    const isInstallment = original.seriesType === "installment";
    openConfirmDialog({
      title: "Salvar alterações",
      desc: isInstallment ? "Alterar quais parcelas?" : "Alterar quais meses?",
      detailHTML,
      options: [
        { label: "Só esta", onConfirm: () => commitSave({ base, editingId, recurrence, installments, scope: "one" }) },
        { label: isInstallment ? "Esta e as próximas" : "Desta em diante", onConfirm: () => commitSave({ base, editingId, recurrence, installments, scope: "forward" }) },
      ],
    });
  } else {
    openConfirmDialog({
      title: editingId ? "Salvar alterações?" : "Confirmar lançamento?",
      desc: "Confira os dados antes de salvar.",
      detailHTML,
      confirmLabel: "Confirmar",
      onConfirm: () => commitSave({ base, editingId, recurrence, installments }),
    });
  }
}

function commitSave({ base, editingId, recurrence, installments, scope = "forward" }) {
  let message;
  if (editingId) {
    const original = state.transactions.find((item) => item.id === editingId);
    const sameType = (original?.seriesType || "single") === recurrence;
    if (sameType) {
      const patch = { category: base.category, description: base.description, amount: base.amount, note: base.note };
      if (original?.seriesId) {
        state.transactions.forEach((item) => {
          if (item.seriesId !== original.seriesId) return;
          const match = scope === "one" ? item.id === editingId : item.date >= original.date;
          if (match) Object.assign(item, patch);
        });
      } else if (original) {
        Object.assign(original, patch, { date: base.date });
      }
    } else {
      const keepStatus = original?.status || "";
      const pivot = original?.date || base.date;
      if (original?.seriesId) {
        state.transactions = state.transactions.filter(
          (item) => !(item.seriesId === original.seriesId && item.date >= pivot),
        );
      } else if (original) {
        state.transactions = state.transactions.filter((item) => item.id !== editingId);
      }
      const occurrences = buildOccurrences(base, recurrence, installments);
      if (occurrences[0]) occurrences[0].status = keepStatus;
      state.transactions.push(...occurrences);
    }
    message = "Lançamento atualizado";
  } else {
    const occurrences = buildOccurrences(base, recurrence, installments);
    state.transactions.push(...occurrences);
    message = occurrences.length > 1 ? `${occurrences.length} lançamentos adicionados` : "Lançamento adicionado";
  }
  saveState();
  closeEntrySheet();
  selectedMonth = new Date(`${base.date}T12:00:00`);
  render();
  toast(message);
}

function closeConfirm() {
  $("#confirmSheet").hidden = true;
  confirmActions = [];
  // Mantém o body travado se ainda houver o formulário/seletor aberto por baixo.
  if ($("#entrySheet").hidden && $("#categorySheet").hidden) document.body.classList.remove("sheet-open");
}

function closeEntryMenus() {
  $$(".entry-actions-menu").forEach((menu) => { menu.hidden = true; });
}

function renderCards() {
  const items = selectedTransactions().filter(isCardTransaction);
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  $("#cardsTotal").textContent = money(total);
  $("#cardsCount").textContent = items.length
    ? `${items.length} lançamento${items.length === 1 ? "" : "s"} no mês`
    : "Nenhum lançamento no mês.";
}

function renderOverdue() {
  const items = state.transactions.filter(isOverdue);
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const card = $("#overdueCard");
  card.hidden = items.length === 0;
  if (!items.length) return;
  $("#overdueTotal").textContent = money(total);
  $("#overdueCount").textContent = `${items.length} conta${items.length === 1 ? "" : "s"} para regularizar`;
}

let detailSort = "unpaid";

function sortComparator(sort) {
  const paidRank = (item) => (item.status === "P" ? 1 : 0);
  const byDate = (a, b) => b.date.localeCompare(a.date);
  if (sort === "paid") return (a, b) => paidRank(b) - paidRank(a) || byDate(a, b);
  if (sort === "asc") return (a, b) => Number(a.amount) - Number(b.amount);
  if (sort === "desc") return (a, b) => Number(b.amount) - Number(a.amount);
  if (sort === "category") {
    // Agrupa: mesma categoria fica junta; dentro dela, maior valor primeiro.
    return (a, b) => a.category.localeCompare(b.category, "pt-BR") || Number(b.amount) - Number(a.amount);
  }
  return (a, b) => paidRank(a) - paidRank(b) || byDate(a, b); // "unpaid" = não pagos primeiro
}

function sortOptionList() {
  const paidWord = { income: "Recebidos", saving: "Reservados" }[detailType] || "Pagos";
  const unpaidWord = { income: "Não recebidos", saving: "Não reservados" }[detailType] || "Não pagos";
  return [
    { key: "unpaid", label: `${unpaidWord} primeiro` },
    { key: "paid", label: `${paidWord} primeiro` },
    { key: "desc", label: "Maior valor" },
    { key: "asc", label: "Menor valor" },
    { key: "category", label: "Agrupar por categoria" },
  ];
}

function renderSortSheet() {
  $("#sortOptions").innerHTML = sortOptionList().map((option) => `
    <button type="button" class="sort-option${option.key === detailSort ? " is-selected" : ""}" data-sort="${option.key}">
      <span>${option.label}</span>
      <span class="sort-check" aria-hidden="true">✓</span>
    </button>
  `).join("");
}

function openSortSheet() {
  renderSortSheet();
  $("#sortSheet").hidden = false;
  document.body.classList.add("sheet-open");
}

function closeSortSheet() {
  $("#sortSheet").hidden = true;
  document.body.classList.remove("sheet-open");
}

// Popup do card de Orçamento: lista os lançamentos daquela categoria no mês selecionado.
function openCatView(name) {
  const category = getCategory(name, "expense");
  const items = selectedTransactions()
    .filter((item) => item.type === "expense" && item.category === name)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  $("#catViewTitle").textContent = category.name;
  const monthLabel = capitalize(monthOnly.format(selectedMonth));
  $("#catViewSub").textContent = items.length
    ? `${items.length} lançamento${items.length === 1 ? "" : "s"} · ${money(total)} em ${monthLabel}`
    : `Sem lançamentos em ${monthLabel}`;

  const list = $("#catViewList");
  list.innerHTML = items.length
    ? items.map((item) => {
        const date = shortDate.format(new Date(`${item.date}T12:00:00`));
        const paid = item.status === "P";
        const note = recurNote(item);
        return `
          <div class="cat-view-row${paid ? " is-paid" : ""}" style="--tone:${category.color}">
            <span class="category-dot" aria-hidden="true">${category.icon}</span>
            <div class="cat-view-info">
              <strong>${escapeHtml(item.description)}</strong>
              <span>${date}${note ? ` · ${note}` : ""}${paid ? " · Pago" : ""}</span>
            </div>
            <span class="cat-view-amount">-${format(item.amount)}</span>
          </div>
        `;
      }).join("")
    : `<div class="cat-view-empty">Nada lançado nesta categoria neste mês.</div>`;

  $("#catViewSheet").hidden = false;
  document.body.classList.add("sheet-open");
}

function closeCatView() {
  $("#catViewSheet").hidden = true;
  document.body.classList.remove("sheet-open");
}

function renderDetail() {
  if (!detailType) return;
  const meta = typeMeta[detailType];
  const overdueView = detailType === "overdue";
  const matches = overdueView ? isOverdue : detailType === "cards" ? isCardTransaction : (item) => item.type === detailType;
  // "Contas em atraso" atravessa meses; as demais telas ficam no mês selecionado.
  const source = overdueView ? state.transactions : selectedTransactions();
  const items = source
    .filter(matches)
    .sort(sortComparator(detailSort));
  const paid = items.filter((item) => item.status === "P");
  const pending = items.filter((item) => item.status !== "P");
  const paidValue = paid.reduce((sum, item) => sum + Number(item.amount), 0);
  const pendingValue = pending.reduce((sum, item) => sum + Number(item.amount), 0);

  $("#detailTitle").textContent = meta.title;
  $("#detailPendingLabel").textContent = meta.pendingLabel;
  $("#detailPaidLabel").textContent = meta.paidLabel;
  $("#detailPending").textContent = money(pendingValue);
  $("#detailPaid").textContent = overdueView ? String(items.length) : money(paidValue);

  const list = $("#detailList");
  if (!items.length) {
    list.innerHTML = `
      <div class="empty-detail">
        <span class="empty-art" aria-hidden="true">🪴</span>
        <h3>${meta.emptyTitle}</h3>
        <p>${meta.emptyHint}</p>
      </div>
    `;
    return;
  }
  const labelType = overdueView ? "expense" : detailType;
  if (detailSort === "category") {
    let lastCategory = null;
    list.innerHTML = items.map((item) => {
      let header = "";
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        const groupTotal = items
          .filter((one) => one.category === item.category)
          .reduce((sum, one) => sum + Number(one.amount), 0);
        const cat = getCategory(item.category, item.type);
        header = `<div class="entry-group" style="--tone:${cat.color}"><span>${escapeHtml(item.category)}</span><span>${money(groupTotal)}</span></div>`;
      }
      return header + detailCard(item, labelType);
    }).join("");
    return;
  }
  list.innerHTML = items.map((item) => detailCard(item, labelType)).join("");
}

function groupExpenses(items = selectedTransactions()) {
  const map = new Map();
  items.filter((item) => item.type === "expense").forEach((item) => {
    map.set(item.category, (map.get(item.category) || 0) + Number(item.amount));
  });
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function renderBudgets() {
  const grouped = new Map(groupExpenses().map((item) => [item.category, item.total]));
  const removed = new Set(state.removedCategories || []);
  const expenseNames = new Set([
    ...Object.keys(state.budgets || {}),
    ...(state.customCategories?.expense || []),
    ...state.transactions.filter((item) => item.type === "expense").map((item) => item.category),
  ]);
  const list = $("#budgetList");
  list.innerHTML = [...expenseNames]
    .filter((name) => !removed.has(name))
    .sort((a, b) => a.localeCompare(b, "pt-BR")).map((name) => {
    const category = getCategory(name, "expense");
    const spent = grouped.get(name) || 0;
    const stored = state.budgets?.[name];
    const budget = stored !== undefined ? stored : (category.budget || 0);
    const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const pct = budget > 0 ? Math.round((spent / budget) * 100) : null;
    const over = budget > 0 && spent > budget;
    return `
      <article class="budget-item${over ? " is-over" : ""}" data-view-category="${escapeHtml(category.name)}" role="button" tabindex="0" aria-label="Ver lançamentos de ${escapeHtml(category.name)}" style="--tone:${category.color}; --tint:${category.tint}; --progress:${progress}%">
        <span class="category-dot" aria-hidden="true">${category.icon}</span>
        <div class="budget-main">
          <strong>${escapeHtml(category.name)}</strong>
          <div class="progress" aria-label="${escapeHtml(category.name)}: ${Math.round(progress)}% do limite usado"><span></span></div>
        </div>
        <div class="budget-values">
          <strong>${money(spent)}</strong>
          <span>${budget > 0 ? `de ${money(budget)}` : "sem limite"}${pct !== null ? ` · <b class="budget-pct">${pct}%</b>` : ""}</span>
        </div>
        <div class="item-actions">
          <button class="edit-btn" type="button" data-edit-category="${escapeHtml(category.name)}" aria-label="Editar categoria ${escapeHtml(category.name)}">Editar</button>
          <button class="delete-btn" type="button" data-delete-category="${escapeHtml(category.name)}" aria-label="Apagar categoria ${escapeHtml(category.name)}">×</button>
        </div>
      </article>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function render() {
  ensureHorizon();
  setMonthLabel();
  renderSummary();
  renderBalanceChart();
  renderCategoryChart();
  renderCards();
  renderReserve();
  renderOverdue();
  renderAlerts();
  renderBudgets();
  renderDetail();
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function changeMonth(offset) {
  selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
  render();
}

function route() {
  const type = routes[location.hash] || null;
  detailType = type;
  document.body.dataset.section = type || "home";
  document.body.classList.toggle("detail-mode", Boolean(type));
  $("#homeView").hidden = Boolean(type);
  $("#detailView").hidden = !type;
  if (type) {
    $("#detailView").dataset.type = type;
    $(".detail-month").hidden = type === "overdue";
    window.scrollTo({ top: 0 });
    render();
    return;
  }
  render();
  const anchor = /^#[A-Za-z][\w-]*$/.test(location.hash) ? document.getElementById(location.hash.slice(1)) : null;
  if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.scrollTo({ top: 0 });
}

function entryTypeFor(viewType) {
  return viewType === "cards" || viewType === "overdue" ? "expense" : viewType;
}

let entryRecurrence = "single";
let entryInstallments = 12;
let entryEditing = false;

function applyRecurrence(kind) {
  entryRecurrence = kind;
  $("#recurrence").value = kind;
  $$(".recur-seg button").forEach((button) => button.classList.toggle("active", button.dataset.recur === kind));
  $("#instField").hidden = kind !== "installment";
  updateRecurHint();
}

function setRecurrence(kind) {
  applyRecurrence(kind);
}

function setInstallments(count) {
  entryInstallments = Math.min(60, Math.max(2, count));
  $("#instCount").textContent = entryInstallments;
  updateRecurHint();
}

function updateRecurHint() {
  const hint = $("#recurHint");
  const noun = { income: "entrada", saving: "reserva" }[selectedType] || "conta";
  const forward = entryEditing ? " Muda deste mês em diante." : "";
  if (entryRecurrence === "fixed") hint.textContent = `Repete todo mês até você apagar (${noun} fixa).${forward}`;
  else if (entryRecurrence === "installment") hint.textContent = `Repete por ${entryInstallments} meses.${forward}`;
  else hint.textContent = `Lançamento só neste mês.${forward}`;
}

function openEntrySheet(type, item = null) {
  selectedType = type;
  const form = $("#transactionForm");
  form.reset();
  $("#editingId").value = item?.id || "";
  $("#description").value = item?.description || "";
  $("#amount").value = item?.amount || "";
  const today = new Date();
  const viewingCurrentMonth = monthKey(today) === monthKey(selectedMonth);
  $("#date").value = item?.date || toInputDate(viewingCurrentMonth ? today : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
  setCategory(item?.category || categoryNames(type)[0] || "");
  $("#note").value = item?.note || "";
  $("#entryTitle").textContent = item ? "Editar lançamento" : typeMeta[type].newLabel;
  $("#submitTransactionBtn").textContent = item ? "Salvar alterações" : "Adicionar lançamento";

  entryEditing = Boolean(item);
  setInstallments(item?.installmentTotal || 12);
  applyRecurrence(item?.seriesType === "installment" ? "installment"
    : item?.seriesType === "fixed" ? "fixed" : "single");

  $("#entrySheet").hidden = false;
  document.body.classList.add("sheet-open");
  $("#description").focus();
}

function closeEntrySheet() {
  $("#entrySheet").hidden = true;
  document.body.classList.remove("sheet-open");
  $("#transactionForm").reset();
  $("#editingId").value = "";
  entryEditing = false;
  setInstallments(12);
  applyRecurrence("single");
}

function openChooser() {
  $("#chooserSheet").hidden = false;
  document.body.classList.add("sheet-open");
}

function closeChooser() {
  $("#chooserSheet").hidden = true;
  document.body.classList.remove("sheet-open");
}

function startTransactionEdit(id) {
  const item = state.transactions.find((transactionItem) => transactionItem.id === id);
  if (!item) return;
  openEntrySheet(item.type, item);
}

// Editor de categoria (nome + limite mensal) — sheet no padrão do app.
// Sem argumento = criar nova categoria; com nome = editar existente.
function openBudgetSheet(name) {
  const isNew = !name;
  $("#budgetSheetTitle").textContent = isNew ? "Nova categoria" : "Editar categoria";
  $("#budgetOldName").value = name || "";
  $("#budgetName").value = name || "";
  let budget = 0;
  if (!isNew) {
    const stored = state.budgets?.[name];
    const category = getCategory(name, "expense");
    budget = stored !== undefined ? stored : (category.budget || 0);
  }
  $("#budgetNoLimit").checked = isNew ? false : !(budget > 0);
  $("#budgetLimit").value = budget > 0 ? budget : "";
  updateBudgetLimitState();
  $("#budgetSheet").hidden = false;
  document.body.classList.add("sheet-open");
  if (isNew) setTimeout(() => $("#budgetName").focus(), 0);
}

function closeBudgetSheet() {
  $("#budgetSheet").hidden = true;
  document.body.classList.remove("sheet-open");
}

function updateBudgetLimitState() {
  const noLimit = $("#budgetNoLimit").checked;
  $("#budgetLimit").disabled = noLimit;
  $("#budgetLimit").closest(".inst-field").classList.toggle("is-disabled", noLimit);
}

function saveCategory(oldName, newNameRaw, noLimit, limitRaw) {
  const clean = (newNameRaw || "").trim();
  if (!clean) return;
  if (oldName && clean !== oldName) {
    // Renomear categoria existente em todos os lançamentos.
    state.transactions.forEach((item) => { if (item.category === oldName) item.category = clean; });
    if (state.customCategories) {
      Object.keys(state.customCategories).forEach((type) => {
        const index = state.customCategories[type].indexOf(oldName);
        if (index >= 0) state.customCategories[type][index] = clean;
      });
    }
    if (state.budgets?.[oldName] !== undefined) {
      state.budgets[clean] = state.budgets[oldName];
      delete state.budgets[oldName];
    }
    if (!state.removedCategories) state.removedCategories = [];
    if (!state.removedCategories.includes(oldName)) state.removedCategories.push(oldName);
    state.removedCategories = state.removedCategories.filter((n) => n !== clean);
    addCustomCategory("expense", clean);
  } else if (!oldName) {
    // Criar categoria nova (aparece na lista mesmo sem lançamento ainda).
    addCustomCategory("expense", clean);
    if (state.removedCategories) state.removedCategories = state.removedCategories.filter((n) => n !== clean);
  }
  if (!state.budgets) state.budgets = {};
  // 0 = "sem limite" explícito (sobrepõe qualquer limite padrão da categoria).
  state.budgets[clean] = noLimit ? 0 : (Number(limitRaw) || 0);
  saveState();
  render();
  toast(oldName ? "Categoria atualizada" : "Categoria criada");
}

function deleteCategory(name) {
  const count = state.transactions.filter((item) => item.category === name).length;
  openConfirmDialog({
    title: "Apagar categoria?",
    desc: count
      ? `Remove "${name}" e ${count} lançamento${count === 1 ? "" : "s"} vinculado${count === 1 ? "" : "s"}.`
      : `Remove a categoria "${name}".`,
    confirmLabel: "Apagar",
    danger: true,
    onConfirm: () => {
      state.transactions = state.transactions.filter((item) => item.category !== name);
      if (state.budgets?.[name] !== undefined) delete state.budgets[name];
      saveState();
      render();
      toast("Categoria apagada");
    },
  });
}

function deleteTransaction(id) {
  const item = state.transactions.find((transactionItem) => transactionItem.id === id);
  if (!item) return;
  const sign = item.type === "income" ? "+" : "-";
  const date = shortDate.format(new Date(`${item.date}T12:00:00`));
  const detailHTML = `
    <strong>${escapeHtml(item.description)}</strong>
    <span>${escapeHtml(item.category)} · ${date}</span>
    <em class="${item.type}">${sign}${format(item.amount)}</em>
  `;
  if (item.seriesId) {
    const isInstallment = item.seriesType === "installment";
    openConfirmDialog({
      title: isInstallment ? "Apagar parcela" : "Apagar conta fixa",
      desc: isInstallment ? "Apagar quais parcelas?" : "Apagar quais meses?",
      detailHTML,
      options: [
        { label: "Só esta", danger: true, onConfirm: () => deleteSeriesOccurrence(item, "one") },
        { label: isInstallment ? "Esta e as próximas" : "Desta em diante", danger: true, onConfirm: () => deleteSeriesOccurrence(item, "forward") },
      ],
    });
  } else {
    openConfirmDialog({
      title: "Apagar lançamento?",
      desc: "Essa ação não pode ser desfeita.",
      detailHTML,
      confirmLabel: "Apagar",
      danger: true,
      onConfirm: () => {
        state.transactions = state.transactions.filter((t) => t.id !== id);
        saveState();
        render();
        toast("Lançamento removido");
      },
    });
  }
}

// Apaga ocorrência(s) de uma série SEM que o ensureHorizon recrie:
// "one" = só este mês (marca skip); "forward" = deste mês em diante (marca fim da série).
function deleteSeriesOccurrence(item, mode) {
  if (!state.seriesSkips) state.seriesSkips = {};
  if (!state.seriesEnds) state.seriesEnds = {};
  if (mode === "one") {
    state.seriesSkips[`${item.seriesId}|${item.date.slice(0, 7)}`] = true;
    state.transactions = state.transactions.filter((t) => t.id !== item.id);
    toast("Lançamento removido");
  } else {
    state.seriesEnds[item.seriesId] = item.date;
    state.transactions = state.transactions.filter(
      (t) => !(t.seriesId === item.seriesId && t.date >= item.date),
    );
    toast("Removido deste mês em diante");
  }
  saveState();
  render();
}

function handleDetailClick(event) {
  const payButton = event.target.closest("[data-pay]");
  if (payButton) {
    closeEntryMenus();
    requestPay(payButton.dataset.pay);
    return;
  }
  const menuButton = event.target.closest("[data-menu]");
  if (menuButton) {
    const menu = menuButton.closest(".entry-card").querySelector("[data-actions]");
    const willOpen = menu.hidden;
    closeEntryMenus();
    menu.hidden = !willOpen;
    return;
  }
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    closeEntryMenus();
    startTransactionEdit(editButton.dataset.edit);
    return;
  }
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    closeEntryMenus();
    deleteTransaction(deleteButton.dataset.delete);
  }
}

function bindSwipe(container) {
  let active = null;

  container.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const face = event.target.closest(".entry-face");
    if (!face || event.target.closest(".pay-pill, .entry-menu, .entry-actions-menu")) return;
    const card = face.closest(".entry-card");
    active = { face, card, startX: event.clientX, dx: 0, width: card.offsetWidth, moved: false };
    face.style.transition = "none";
    face.setPointerCapture?.(event.pointerId);
  });

  container.addEventListener("pointermove", (event) => {
    if (!active) return;
    let dx = event.clientX - active.startX;
    const paid = active.card.classList.contains("is-paid");
    dx = paid ? Math.min(Math.max(dx, 0), active.width) : Math.max(Math.min(dx, 0), -active.width);
    active.dx = dx;
    if (Math.abs(dx) > 4) active.moved = true;
    active.face.style.transform = `translateX(${dx}px)`;
  });

  const finish = () => {
    if (!active) return;
    const { face, card, dx, width } = active;
    active = null;
    face.style.transition = "";
    face.style.transform = "";
    if (Math.abs(dx) > width * 0.4) requestPay(card.dataset.id);
  };

  container.addEventListener("pointerup", finish);
  container.addEventListener("pointercancel", finish);
}

// Arrastar o hero de mês: esquerda = próximo mês, direita = mês anterior.
function bindMonthSwipe(el) {
  if (!el) return;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  el.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  });
  const finish = (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      changeMonth(dx < 0 ? 1 : -1);
    }
  };
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", () => { tracking = false; });
}

// Swipe horizontal genérico: chama cb(+1) ao arrastar p/ esquerda, cb(-1) p/ direita.
// Engole o clique seguinte quando houve arrasto (evita marcar coluna sem querer).
function bindHorizontalSwipe(el, cb) {
  if (!el) return;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let suppress = false;
  el.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  });
  const finish = (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppress = true;
      cb(dx < 0 ? 1 : -1);
    }
  };
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", () => { tracking = false; });
  el.addEventListener("click", (event) => {
    if (suppress) { event.stopPropagation(); event.preventDefault(); suppress = false; }
  }, true);
}

function bindEvents() {
  window.addEventListener("hashchange", route);

  // "Principal" sempre leva pro topo da home (mesmo já estando nela).
  $("#navHome").addEventListener("click", (event) => {
    event.preventDefault();
    if (location.hash && location.hash !== "#/") location.hash = "#/";
    window.scrollTo({ top: 0 });
  });

  $("#prevMonth").addEventListener("click", () => changeMonth(-1));
  $("#nextMonth").addEventListener("click", () => changeMonth(1));
  bindMonthSwipe($(".balance-card"));

  // Gráfico de balanço: navegação por ano, marcar/desmarcar colunas e chips de período.
  const changeBalanceYear = (offset) => { balanceYear += offset; renderBalanceChart(); };
  $("#balancePrevYear").addEventListener("click", () => changeBalanceYear(-1));
  $("#balanceNextYear").addEventListener("click", () => changeBalanceYear(1));
  bindHorizontalSwipe($("#balanceBars"), (dir) => changeBalanceYear(dir));
  $("#balanceBars").addEventListener("click", (event) => {
    const bar = event.target.closest("[data-bal-month]");
    if (!bar) return;
    const key = bar.dataset.balMonth;
    if (balanceSelection.has(key)) balanceSelection.delete(key);
    else balanceSelection.add(key);
    renderBalanceChart();
  });
  $("#balanceReserveToggle").addEventListener("click", () => {
    balanceIncludeReserve = !balanceIncludeReserve;
    renderBalanceChart();
  });
  $("#balanceChips").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-bal-preset]");
    if (!chip) return;
    const preset = chip.dataset.balPreset;
    balanceSelection = preset === "dez" ? defaultBalanceSelection()
      : rangeFromNow(Number(preset));
    balanceYear = new Date().getFullYear();
    renderBalanceChart();
  });
  $("#detailPrevMonth").addEventListener("click", () => changeMonth(-1));
  $("#detailNextMonth").addEventListener("click", () => changeMonth(1));
  $("#detailBack").addEventListener("click", () => { location.hash = "#/"; });
  $("#detailFilter").addEventListener("click", openSortSheet);
  $("#sortCloseBtn").addEventListener("click", closeSortSheet);
  $("#sortOptions").addEventListener("click", (event) => {
    const option = event.target.closest("[data-sort]");
    if (!option) return;
    detailSort = option.dataset.sort;
    renderDetail();
    closeSortSheet();
  });
  $("#sortClearBtn").addEventListener("click", () => {
    detailSort = "unpaid";
    renderDetail();
    closeSortSheet();
  });
  $("#catViewCloseBtn").addEventListener("click", closeCatView);
  $("#catViewSheet").addEventListener("click", (event) => {
    if (event.target === $("#catViewSheet")) closeCatView();
  });

  $("#navAddBtn").addEventListener("click", () => {
    if (detailType) {
      openEntrySheet(entryTypeFor(detailType));
    } else {
      openChooser();
    }
  });

  $("#entryCloseBtn").addEventListener("click", closeEntrySheet);
  $("#chooserCloseBtn").addEventListener("click", closeChooser);
  $("#categoryCloseBtn").addEventListener("click", closeCategorySheet);

  // Cada backdrop fecha só o seu sheet (categoria abre por cima do formulário sem fechá-lo).
  [["#entrySheet", closeEntrySheet], ["#chooserSheet", closeChooser], ["#confirmSheet", closeConfirm], ["#categorySheet", closeCategorySheet], ["#sortSheet", closeSortSheet], ["#budgetSheet", closeBudgetSheet]].forEach(([selector, close]) => {
    const backdrop = $(selector);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!$("#catViewSheet").hidden) { closeCatView(); return; }
    if (!$("#sortSheet").hidden) { closeSortSheet(); return; }
    if (!$("#categorySheet").hidden) { closeCategorySheet(); return; }
    if (!$("#budgetSheet").hidden) { closeBudgetSheet(); return; }
    if (!$("#confirmSheet").hidden) { closeConfirm(); return; }
    closeEntrySheet();
    closeChooser();
  });

  $("#categoryTrigger").addEventListener("click", openCategorySheet);
  $("#categoryOptions").addEventListener("click", (event) => {
    const pick = event.target.closest("[data-category]");
    if (pick) { setCategory(pick.dataset.category); closeCategorySheet(); return; }

    const menu = event.target.closest("[data-cat-menu]");
    if (menu) { categoryMenuName = menu.dataset.catMenu; categoryEditingName = null; categoryDeletingName = null; renderCategorySheet(); return; }
    if (event.target.closest("[data-cat-menu-close]")) { categoryMenuName = null; renderCategorySheet(); return; }

    const edit = event.target.closest("[data-cat-edit]");
    if (edit) { categoryEditingName = edit.dataset.catEdit; categoryMenuName = null; categoryDeletingName = null; renderCategorySheet(); return; }
    if (event.target.closest("[data-cat-cancel]")) { categoryEditingName = null; renderCategorySheet(); return; }

    const del = event.target.closest("[data-cat-delete]");
    if (del) { categoryDeletingName = del.dataset.catDelete; categoryMenuName = null; categoryEditingName = null; renderCategorySheet(); return; }
    if (event.target.closest("[data-cat-delete-no]")) { categoryDeletingName = null; renderCategorySheet(); return; }
    const delYes = event.target.closest("[data-cat-delete-yes]");
    if (delYes) {
      const count = deleteCategoryEverywhere(delYes.dataset.catDeleteYes);
      categoryDeletingName = null;
      renderCategorySheet();
      toast(count ? `Categoria e ${count} lançamento${count === 1 ? "" : "s"} apagados` : "Categoria apagada");
    }
  });
  $("#categoryOptions").addEventListener("submit", (event) => {
    const form = event.target.closest("[data-cat-save]");
    if (!form) return;
    event.preventDefault();
    const oldName = form.dataset.catSave;
    const newName = form.querySelector(".cat-edit-input").value;
    renameCategoryEverywhere(oldName, newName);
    categoryEditingName = null;
    renderCategorySheet();
    toast("Categoria atualizada");
  });
  $("#newCategoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#newCategoryInput").value.trim();
    if (!name) return;
    addCustomCategory(selectedType, name);
    setCategory(name);
    $("#newCategoryInput").value = "";
    closeCategorySheet();
    toast("Categoria criada");
  });

  $$(".recur-seg button").forEach((button) => {
    button.addEventListener("click", () => setRecurrence(button.dataset.recur));
  });
  $("#instMinus").addEventListener("click", () => setInstallments(entryInstallments - 1));
  $("#instPlus").addEventListener("click", () => setInstallments(entryInstallments + 1));

  $("#confirmActions").addEventListener("click", (event) => {
    if (event.target.closest("[data-confirm-cancel]")) { closeConfirm(); return; }
    const act = event.target.closest("[data-confirm-action]");
    if (act) runConfirmAction(Number(act.dataset.confirmAction));
  });
  $("#confirmCloseBtn").addEventListener("click", closeConfirm);

  $("#chooserSheet").addEventListener("click", (event) => {
    const option = event.target.closest("[data-new]");
    if (!option) return;
    const type = option.dataset.new;
    closeChooser();
    location.hash = typeMeta[type].route;
    openEntrySheet(type);
  });

  $("#transactionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const editingId = data.get("editingId");
    const base = {
      type: selectedType,
      category: data.get("category"),
      description: data.get("description").trim(),
      amount: Number(data.get("amount")),
      date: data.get("date"),
      note: data.get("note").trim(),
    };

    const recurrence = data.get("recurrence") || "single";
    openSaveConfirm(base, editingId, recurrence, entryInstallments);
  });

  $("#budgetList").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-category]");
    const remove = event.target.closest("[data-delete-category]");
    if (edit) { openBudgetSheet(edit.dataset.editCategory); return; }
    if (remove) { deleteCategory(remove.dataset.deleteCategory); return; }
    const open = event.target.closest("[data-view-category]");
    if (open) openCatView(open.dataset.viewCategory);
  });
  $("#budgetList").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const open = event.target.closest("[data-view-category]");
    if (!open || event.target.closest("button")) return;
    event.preventDefault();
    openCatView(open.dataset.viewCategory);
  });

  $("#addCategoryBtn").addEventListener("click", () => openBudgetSheet());
  $("#budgetCloseBtn").addEventListener("click", closeBudgetSheet);
  $("#budgetNoLimit").addEventListener("change", updateBudgetLimitState);
  $("#budgetForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const oldName = $("#budgetOldName").value;
    closeBudgetSheet();
    saveCategory(oldName, $("#budgetName").value, $("#budgetNoLimit").checked, $("#budgetLimit").value);
  });

  $("#detailList").addEventListener("click", handleDetailClick);
  bindSwipe($("#detailList"));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".entry-menu, .entry-actions-menu")) closeEntryMenus();
  });

  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `carteira-prime-${toInputDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast("Arquivo exportado");
  });

  $("#importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported.transactions)) throw new Error("Formato inválido");
      state = applyMigrations({ transactions: imported.transactions });
      saveState();
      render();
      toast("Dados importados");
    } catch {
      toast("Não consegui importar esse arquivo");
    } finally {
      event.target.value = "";
    }
  });
}

bindEvents();
route();
