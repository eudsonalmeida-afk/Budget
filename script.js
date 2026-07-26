import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://kqeolflqbesqvkwuidcx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gQY6sALUMDv4GbNx5xUnHA_FZgNJ-2n";
const SITE_URL = "https://eudsonalmeida-afk.github.io/Budget/";
const THEME_KEY = "budget_feliz_theme";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const banks = [
  ["PicPay", "picpay"],
  ["Inter", "inter"],
  ["Bradesco", "bradesco"],
  ["Banco do Brasil", "bb"],
  ["Itaú", "itau"],
  ["Dinheiro / Débito", "cash"]
];

const emoji = {
  "Alimentação": "🍔",
  "Transporte": "🚗",
  "Casa": "🏠",
  "Lazer": "🎮",
  "Saúde": "💊",
  "Compras": "🛒",
  "Assinatura": "📱",
  "Reforma do quarto": "🛠️",
  "Outros": "✨"
};

const $ = id => document.getElementById(id);
const e = {
  authScreen: $("authScreen"), appRoot: $("appRoot"), authForm: $("authForm"),
  authTitle: $("authTitle"), authDescription: $("authDescription"),
  authEmail: $("authEmail"), authPassword: $("authPassword"),
  authSubmit: $("authSubmit"), authModeToggle: $("authModeToggle"), authMessage: $("authMessage"),
  logout: $("logout"), syncStatus: $("syncStatus"),
  prev: $("prev"), next: $("next"), monthBtn: $("monthBtn"), monthPicker: $("monthPicker"),
  monthLabel: $("monthLabel"), salaryOut: $("salaryOut"), spentOut: $("spentOut"),
  balanceOut: $("balanceOut"), balanceMsg: $("balanceMsg"), salaryEdit: $("salaryEdit"),
  categories: $("categories"), banks: $("banks"), amount: $("amount"), add: $("add"),
  noteToggle: $("noteToggle"), note: $("note"), preview: $("preview"), today: $("today"),
  bankTotals: $("bankTotals"), filters: $("filters"), count: $("count"),
  filteredTotal: $("filteredTotal"), list: $("list"), export: $("export"),
  salaryDialog: $("salaryDialog"), salaryForm: $("salaryForm"), salaryInput: $("salaryInput"),
  salaryMonth: $("salaryMonth"), salaryClose: $("salaryClose"), salaryCancel: $("salaryCancel"),
  deleteDialog: $("deleteDialog"), deleteCancel: $("deleteCancel"),
  deleteConfirm: $("deleteConfirm"), theme: $("theme"), toast: $("toast")
};

let authMode = "signin";
let currentUser = null;
let month = monthKey(new Date());
let monthData = { salary: 0, expenses: [] };
let category = "";
let bank = "";
let filter = "Todos";
let pendingDeleteId = null;
let toastTimer;

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthDate(key) {
  const [year, m] = key.split("-").map(Number);
  return new Date(year, m - 1, 1, 12);
}

function monthName(key) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthDate(key));
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

function parseMoney(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
}

function maskMoney(value) {
  const digits = value.replace(/\D/g, "");
  return digits ? (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }) : "";
}

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[c]);
}

function bankClass(name) {
  return banks.find(item => item[0] === name)?.[1] || "cash";
}

function total(list = monthData.expenses) {
  return list.reduce((sum, item) => sum + Number(item.amount), 0);
}

function setSync(text, state = "") {
  e.syncStatus.textContent = text;
  e.syncStatus.className = `sync-status ${state}`.trim();
}

function showAuth(message = "", state = "") {
  e.authScreen.classList.remove("hidden");
  e.appRoot.classList.add("hidden");
  e.logout.classList.add("hidden");
  e.authMessage.textContent = message;
  e.authMessage.className = `auth-message ${state}`.trim();
}

function showApp() {
  e.authScreen.classList.add("hidden");
  e.appRoot.classList.remove("hidden");
  e.logout.classList.remove("hidden");
}

function friendlyAuthError(message) {
  const text = String(message || "");
  if (text.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (text.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (text.includes("User already registered")) return "Este e-mail já possui uma conta.";
  if (text.includes("Password should be")) return "Use uma senha com pelo menos 6 caracteres.";
  if (text.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  return text || "Não foi possível concluir a operação.";
}

async function handleAuth(event) {
  event.preventDefault();
  e.authSubmit.disabled = true;
  e.authMessage.textContent = authMode === "signin" ? "Entrando…" : "Criando conta…";
  e.authMessage.className = "auth-message";

  try {
    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: e.authEmail.value.trim(),
        password: e.authPassword.value
      });
      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: e.authEmail.value.trim(),
        password: e.authPassword.value,
        options: { emailRedirectTo: SITE_URL }
      });
      if (error) throw error;

      if (!data.session) {
        e.authMessage.textContent = "Conta criada. Abra seu e-mail e confirme o cadastro.";
        e.authMessage.className = "auth-message success";
      }
    }
  } catch (error) {
    e.authMessage.textContent = friendlyAuthError(error.message);
    e.authMessage.className = "auth-message error";
  } finally {
    e.authSubmit.disabled = false;
  }
}

function toggleAuthMode() {
  authMode = authMode === "signin" ? "signup" : "signin";
  const signup = authMode === "signup";
  e.authTitle.textContent = signup ? "Criar acesso ao Contaê" : "Acessar o Contaê";
  e.authDescription.textContent = signup
    ? "Crie seu acesso para sincronizar seus dados com segurança."
    : "Seus gastos e salários sincronizados onde você estiver.";
  e.authSubmit.textContent = signup ? "Criar conta" : "Entrar";
  e.authModeToggle.textContent = signup ? "Já tenho uma conta" : "Ainda não tenho conta";
  e.authPassword.autocomplete = signup ? "new-password" : "current-password";
  e.authMessage.textContent = "";
}

async function loadMonth() {
  if (!currentUser) return;
  setSync("Sincronizando…");
  try {
    const [budgetResult, expensesResult] = await Promise.all([
      supabase.from("monthly_budgets")
        .select("salary")
        .eq("user_id", currentUser.id)
        .eq("month", month)
        .maybeSingle(),
      supabase.from("expenses")
        .select("id, month, expense_date, category, bank, amount, note, created_at")
        .eq("user_id", currentUser.id)
        .eq("month", month)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

    if (budgetResult.error) throw budgetResult.error;
    if (expensesResult.error) throw expensesResult.error;

    monthData = {
      salary: Number(budgetResult.data?.salary || 0),
      expenses: (expensesResult.data || []).map(row => ({
        id: row.id,
        date: row.expense_date,
        category: row.category,
        bank: row.bank,
        amount: Number(row.amount),
        note: row.note || "",
        createdAt: row.created_at
      }))
    };

    render();
    setSync("Sincronizado", "ok");
  } catch (error) {
    console.error(error);
    setSync("Erro ao sincronizar", "error");
    toast("Erro ao carregar os dados da nuvem.");
  }
}

async function saveSalary(event) {
  event.preventDefault();
  const salary = Number(parseMoney(e.salaryInput.value).toFixed(2));
  setSync("Salvando…");

  const { error } = await supabase.from("monthly_budgets").upsert({
    user_id: currentUser.id,
    month,
    salary,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,month" });

  if (error) {
    console.error(error);
    setSync("Erro ao salvar", "error");
    toast("Não foi possível salvar o salário.");
    return;
  }

  monthData.salary = salary;
  e.salaryDialog.close();
  render();
  setSync("Sincronizado", "ok");
  toast("Salário atualizado na nuvem.");
}

async function addExpense() {
  const amount = parseMoney(e.amount.value);
  if (!category) return toast("Escolha uma categoria.");
  if (!bank) return toast("Escolha como pagou.");
  if (amount <= 0) return toast("Digite um valor maior que zero.");

  const date = month === monthKey(new Date()) ? todayIso() : `${month}-01`;
  e.add.disabled = true;
  setSync("Salvando…");

  const { data, error } = await supabase.from("expenses").insert({
    user_id: currentUser.id,
    month,
    expense_date: date,
    category,
    bank,
    amount: Number(amount.toFixed(2)),
    note: e.note.value.trim() || null
  }).select("id, expense_date, category, bank, amount, note, created_at").single();

  e.add.disabled = false;

  if (error) {
    console.error(error);
    setSync("Erro ao salvar", "error");
    toast("Não foi possível salvar este gasto.");
    return;
  }

  monthData.expenses.unshift({
    id: data.id, date: data.expense_date, category: data.category,
    bank: data.bank, amount: Number(data.amount), note: data.note || "",
    createdAt: data.created_at
  });

  resetEntry();
  render();
  setSync("Sincronizado", "ok");
  toast(`Gasto salvo: ${money(amount)}`);
}

async function deleteExpense() {
  if (!pendingDeleteId) return;
  setSync("Excluindo…");

  const { error } = await supabase.from("expenses")
    .delete()
    .eq("id", pendingDeleteId)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error(error);
    setSync("Erro ao excluir", "error");
    toast("Não foi possível excluir o gasto.");
    return;
  }

  monthData.expenses = monthData.expenses.filter(item => item.id !== pendingDeleteId);
  pendingDeleteId = null;
  e.deleteDialog.close();
  render();
  setSync("Sincronizado", "ok");
  toast("Gasto excluído.");
}

function render() {
  e.monthLabel.textContent = monthName(month);
  e.monthPicker.value = month;
  e.today.textContent = month === monthKey(new Date())
    ? `Hoje • ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date())}`
    : "Mês selecionado";

  const spent = total();
  const balance = monthData.salary - spent;
  e.salaryOut.textContent = money(monthData.salary);
  e.spentOut.textContent = money(spent);
  e.balanceOut.textContent = money(balance);
  e.balanceOut.style.color = balance < 0 ? "#c43c58" : "";
  e.balanceMsg.textContent = monthData.salary <= 0
    ? "Cadastre o salário deste mês."
    : balance < 0
      ? "O orçamento passou do limite."
      : spent
        ? `${Math.min(100, spent / monthData.salary * 100).toFixed(0)}% do salário utilizado.`
        : "Nenhum gasto registrado.";

  renderBankTotals();
  renderList();
  renderPreview();
}

function renderBankTotals() {
  e.bankTotals.innerHTML = banks.map(([name, className]) => {
    const list = monthData.expenses.filter(item => item.bank === name);
    return `<article class="bank-card ${className}">
      <span>${escapeHtml(name)}</span><strong>${money(total(list))}</strong>
      <small>${list.length} ${list.length === 1 ? "gasto" : "gastos"}</small>
    </article>`;
  }).join("");
}

function renderList() {
  let list = [...monthData.expenses];
  if (filter !== "Todos") list = list.filter(item => item.bank === filter);
  list.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));

  e.count.textContent = `${list.length} ${list.length === 1 ? "lançamento" : "lançamentos"}`;
  e.filteredTotal.textContent = money(total(list));

  if (!list.length) {
    e.list.innerHTML = '<div class="empty">🧾<br><b>Nenhum gasto nesta seleção.</b></div>';
    return;
  }

  e.list.innerHTML = list.map(item => {
    const [year, m, day] = item.date.split("-");
    const date = new Date(Number(year), Number(m) - 1, Number(day), 12);
    const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
    const note = item.note ? ` • ${escapeHtml(item.note)}` : "";
    return `<article class="expense">
      <div class="date"><b>${day}</b><small>${shortMonth}</small></div>
      <div class="info"><b>${emoji[item.category] || "✨"} ${escapeHtml(item.category)}</b>
      <small>${escapeHtml(item.bank)}${note}</small></div>
      <span class="tag ${bankClass(item.bank)}">${escapeHtml(item.bank)}</span>
      <span class="value">-${money(item.amount)}</span>
      <button class="trash" data-id="${escapeHtml(item.id)}">🗑️</button>
    </article>`;
  }).join("");
}

function renderPreview() {
  const amount = parseMoney(e.amount.value);
  const parts = [];
  if (category) parts.push(`${emoji[category] || "✨"} ${category}`);
  if (bank) parts.push(bank);
  if (amount) parts.push(money(amount));
  e.preview.textContent = parts.length ? parts.join(" • ") : "Selecione categoria, forma de pagamento e valor.";
}

function selectChoice(container, button, type) {
  container.querySelectorAll("button").forEach(item => item.classList.remove("selected"));
  button.classList.add("selected");
  if (type === "category") category = button.dataset.category;
  else bank = button.dataset.bank;
  renderPreview();
}

function resetEntry() {
  category = "";
  bank = "";
  e.amount.value = "";
  e.note.value = "";
  e.note.classList.add("hidden");
  e.noteToggle.textContent = "+ Adicionar observação";
  document.querySelectorAll(".chips button").forEach(button => button.classList.remove("selected"));
}

async function changeMonth(offset) {
  const date = monthDate(month);
  date.setMonth(date.getMonth() + offset);
  month = monthKey(date);
  filter = "Todos";
  syncFilters();
  await loadMonth();
}

function syncFilters() {
  e.filters.querySelectorAll("button").forEach(button =>
    button.classList.toggle("active", button.dataset.filter === filter)
  );
}

function openSalary() {
  e.salaryMonth.textContent = `Defina a renda disponível para ${monthName(month)}.`;
  e.salaryInput.value = monthData.salary
    ? monthData.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";
  e.salaryDialog.showModal();
}

function toast(message) {
  e.toast.textContent = message;
  e.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => e.toast.classList.remove("show"), 2300);
}

function exportCsv() {
  const list = monthData.expenses;
  if (!list.length) return toast("Não há gastos para exportar.");

  const rows = [
    ["Data", "Categoria", "Banco", "Valor", "Observação"],
    ...list.map(item => [
      item.date.split("-").reverse().join("/"), item.category, item.bank,
      item.amount.toFixed(2).replace(".", ","), item.note || ""
    ])
  ];

  const csv = "\uFEFF" + rows.map(row =>
    row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(";")
  ).join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gastos-${month}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

e.authForm.addEventListener("submit", handleAuth);
e.authModeToggle.addEventListener("click", toggleAuthMode);
e.logout.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

e.prev.addEventListener("click", () => changeMonth(-1));
e.next.addEventListener("click", () => changeMonth(1));
e.monthBtn.addEventListener("click", () =>
  e.monthPicker.showPicker ? e.monthPicker.showPicker() : e.monthPicker.click()
);
e.monthPicker.addEventListener("change", async () => {
  if (!e.monthPicker.value) return;
  month = e.monthPicker.value;
  filter = "Todos";
  syncFilters();
  await loadMonth();
});

e.categories.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (button) selectChoice(e.categories, button, "category");
});
e.banks.addEventListener("click", event => {
  const button = event.target.closest("[data-bank]");
  if (button) selectChoice(e.banks, button, "bank");
});

e.amount.addEventListener("input", () => {
  e.amount.value = maskMoney(e.amount.value);
  renderPreview();
});
e.add.addEventListener("click", addExpense);
e.noteToggle.addEventListener("click", () => {
  e.note.classList.toggle("hidden");
  e.noteToggle.textContent = e.note.classList.contains("hidden")
    ? "+ Adicionar observação" : "− Ocultar observação";
});

e.salaryEdit.addEventListener("click", openSalary);
e.salaryClose.addEventListener("click", () => e.salaryDialog.close());
e.salaryCancel.addEventListener("click", () => e.salaryDialog.close());
e.salaryInput.addEventListener("input", () => e.salaryInput.value = maskMoney(e.salaryInput.value));
e.salaryForm.addEventListener("submit", saveSalary);

e.filters.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  syncFilters();
  renderList();
});

e.list.addEventListener("click", event => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  pendingDeleteId = button.dataset.id;
  e.deleteDialog.showModal();
});
e.deleteCancel.addEventListener("click", () => {
  pendingDeleteId = null;
  e.deleteDialog.close();
});
e.deleteConfirm.addEventListener("click", deleteExpense);
e.export.addEventListener("click", exportCsv);

e.theme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  e.theme.textContent = dark ? "🌙" : "☀️";
});

if (localStorage.getItem(THEME_KEY) === "dark") {
  document.body.classList.add("dark");
  e.theme.textContent = "🌙";
}

supabase.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    showApp();
    await loadMonth();
  } else {
    monthData = { salary: 0, expenses: [] };
    showAuth();
    setSync("Desconectado");
  }
});

const { data: { session } } = await supabase.auth.getSession();
currentUser = session?.user || null;
if (currentUser) {
  showApp();
  await loadMonth();
} else {
  showAuth();
  setSync("Desconectado");
}
