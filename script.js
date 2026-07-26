const salaryInput = document.getElementById("salaryInput");
const saveSalaryBtn = document.getElementById("saveSalaryBtn");
const salaryDisplay = document.getElementById("salaryDisplay");
const expensesDisplay = document.getElementById("expensesDisplay");
const balanceDisplay = document.getElementById("balanceDisplay");
const expenseForm = document.getElementById("expenseForm");
const expensesTableBody = document.getElementById("expensesTableBody");
const resetDataBtn = document.getElementById("resetDataBtn");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabTotal = document.getElementById("tabTotal");

let selectedTab = "Todos";

let salary = Number(localStorage.getItem("budget_salary")) || 0;
let expenses = JSON.parse(localStorage.getItem("budget_expenses")) || [];

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function saveData() {
  localStorage.setItem("budget_salary", salary);
  localStorage.setItem("budget_expenses", JSON.stringify(expenses));
}

function getTotalExpenses(list = expenses) {
  return list.reduce((sum, item) => sum + Number(item.amount), 0);
}

function updateSummary() {
  const totalExpenses = getTotalExpenses();
  const balance = salary - totalExpenses;

  salaryDisplay.textContent = formatCurrency(salary);
  expensesDisplay.textContent = formatCurrency(totalExpenses);
  balanceDisplay.textContent = formatCurrency(balance);
}

function bankClass(bank) {
  switch (bank) {
    case "PicPay":
      return "bank-picpay";
    case "Inter":
      return "bank-inter";
    case "Bradesco":
      return "bank-bradesco";
    case "Banco do Brasil":
      return "bank-bb";
    case "Itaú":
      return "bank-itau";
    default:
      return "bank-other";
  }
}

function renderExpenses() {
  expensesTableBody.innerHTML = "";

  let filteredExpenses = expenses;

  if (selectedTab !== "Todos") {
    filteredExpenses = expenses.filter(item => item.bank === selectedTab);
  }

  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredExpenses.length === 0) {
    expensesTableBody.innerHTML = `
      <tr>
        <td colspan="6">Nenhum gasto encontrado nesta aba.</td>
      </tr>
    `;
  } else {
    filteredExpenses.forEach((expense) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${formatDate(expense.date)}</td>
        <td>${expense.description}</td>
        <td>${expense.category}</td>
        <td>
          <span class="bank-pill ${bankClass(expense.bank)}">${expense.bank}</span>
        </td>
        <td>${formatCurrency(Number(expense.amount))}</td>
        <td>
          <button class="delete-btn" onclick="deleteExpense('${expense.id}')">Excluir</button>
        </td>
      `;

      expensesTableBody.appendChild(row);
    });
  }

  const totalTab = getTotalExpenses(filteredExpenses);
  tabTotal.textContent = formatCurrency(totalTab);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

saveSalaryBtn.addEventListener("click", () => {
  salary = Number(salaryInput.value) || 0;
  saveData();
  updateSummary();
  salaryInput.value = "";
});

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const bank = document.getElementById("bank").value;
  const notes = document.getElementById("notes").value.trim();

  if (!description || !amount || !date || !category || !bank) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  const newExpense = {
    id: crypto.randomUUID(),
    description,
    amount,
    date,
    category,
    bank,
    notes
  };

  expenses.push(newExpense);
  saveData();
  updateSummary();
  renderExpenses();
  expenseForm.reset();
});

function deleteExpense(id) {
  const confirmed = confirm("Deseja realmente excluir este gasto?");
  if (!confirmed) return;

  expenses = expenses.filter(item => item.id !== id);
  saveData();
  updateSummary();
  renderExpenses();
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    selectedTab = button.dataset.tab;
    renderExpenses();
  });
});

resetDataBtn.addEventListener("click", () => {
  const confirmed = confirm("Isso vai apagar salário e despesas salvas. Deseja continuar?");
  if (!confirmed) return;

  localStorage.removeItem("budget_salary");
  localStorage.removeItem("budget_expenses");

  salary = 0;
  expenses = [];
  updateSummary();
  renderExpenses();
});

updateSummary();
renderExpenses();